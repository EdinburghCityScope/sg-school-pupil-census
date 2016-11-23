// MapIt importer script and GeoJson builder.
const edinburghcityscopeUtils = require('edinburghcityscope-utils');
const fs = require('fs');
const path = require('path');
const queue = require('queue');
const _ = require('lodash');
const ProgressBar = require('progress');

const datadir = path.join(__dirname, '..', 'data');
const dataZones2001GeoJsonFile = 'data-zones-2001.geojson';
const intermediateZones2001GeoJsonFile = 'intermediate-zones-2001.geojson';
const csvFilename = 'school-pupil-census.csv';

var zones = []
var dataZones = {
    type: "FeatureCollection",
    features: [],
};

// Fetch 2001 data zones
edinburghcityscopeUtils.fetchGovBoundaries('dz-2001', (err, boundaries, dzones) => {
    if (err) throw err;

    zones = dzones;
    dataZones.features = boundaries;
    fs.writeFileSync(path.join(datadir, dataZones2001GeoJsonFile), JSON.stringify(dataZones), 'utf8');
    console.log('DZ-2001 area collection GeoJSON file saved to ' + dataZones2001GeoJsonFile);

    // Fetch 2001 intermediate zones
    edinburghcityscopeUtils.fetchGovBoundaries('iz-2001', (err, boundaries, izones) => {
        if (err) throw err;

        dataZones.features = boundaries;
        fs.writeFileSync(path.join(datadir, intermediateZones2001GeoJsonFile), JSON.stringify(dataZones), 'utf8');
        console.log('IZ-2001 area collection GeoJSON file saved to ' + intermediateZones2001GeoJsonFile);

        zones.push(...izones)
        interrogateSPARQL(zones)
    });
});

function interrogateSPARQL(zones) {
    var queries = [];
    var batch = queue({concurrency: 1});
    var chunk_size = 1;
    var records = [];
    var fields = [];

    console.log();
    var bar = new ProgressBar('  API calls :bar :percent :etas', {
        complete: '█',
        incomplete: '─',
        width: 55,
        total: Math.ceil(zones.length / chunk_size)
    });

    var fetchChunk = function(done) {
        var query = queries.shift();

        edinburghcityscopeUtils.getScotGovSPARQL(query, (err, rows, columns) => {
            if (err) throw err;

            fields = columns;
            records.push(...rows);

            bar.tick();
            done();
        });
    }

    var outputRecords = function() {
        var json2csv = require('json2csv')
        var csv = json2csv({data: records, fields: fields, newLine: "\n"})
        fs.writeFileSync(path.join(datadir, csvFilename), csv)
    }

    console.log(`Fetching data for ${zones.length} zones, ${chunk_size} at a time...`)
    bar.tick(0);
    _.forEach(_.chunk(zones, chunk_size), (zone_chunk) => {
        queries.push(`
            PREFIX qb: <http://purl.org/linked-data/cube#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            PREFIX ldim: <http://purl.org/linked-data/sdmx/2009/dimension#>
            PREFIX dim: <http://statistics.gov.scot/def/dimension/>
            PREFIX data: <http://statistics.gov.scot/data/>
            
            SELECT ?year ?zone ?age ?gender ?school ?group ?measure ?value
            WHERE {
                ?s qb:dataSet data:school-pupil-census ;
                   qb:measureType ?m ;
                   ?m ?value ;
                   dim:gender ?g ;
                   dim:schoolType ?t ;
                   dim:populationGroup ?p ;
                   dim:age ?a ;
                   ldim:refArea ?z ;
                   ldim:refPeriod ?y .
                ?z skos:notation ?zone .
                ?g rdfs:label ?gender .
                ?t rdfs:label ?school .
                ?p rdfs:label ?group .
                ?a rdfs:label ?age .
                ?y rdfs:label ?year .
                ?m rdfs:label ?measure .
                
                FILTER ( ?z IN (
                    ${zone_chunk.map(zone => `<${zone}>`).join(', ')}
                ))
            }`);

        batch.push(fetchChunk);
    });

    batch.push(outputRecords);

    batch.on('timeout', function(next, job) {
        console.log('Batched fetch from SPARQL timed out!');
        next();
    });

    batch.start();
}

edinburghcityscopeUtils.updateDataModificationDate(path.join(__dirname, '..'));
