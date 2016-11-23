# sg-school-pupil-census
Information from the School Pupil Census for Edinburgh.

This information is taken from the September Scottish Pupil Census, for the relevant year, of publicly funded schools and hence does not include : Pupils attending publicly funded Special Schools; Pupils attending private Independent Schools; Pupils educated outwith the school education system (for example at home) or Adults attending publicly funded secondary schools.

The census was carried out through the Scottish Exchange of Educational Data (ScotXed) project. More information on the ScotXed project is available on http://www.scotxed.net.

A range of information was collected for each individual pupil, including the pupil home postcode, gender and the amount of a pupils curriculum taught through Gaelic. Postcodes were submitted for about 99% of pupils in publicly funded primary and secondary schools. Results contained in the School Education Indictors do not include pupils with a missing or invalid postcode. Therefore, the national figures may not be the same as national figures published elsewhere.

Further results are are available in the publication 'School Meals in Scotland' which can be downloaded at the following link: http://www.scotland.gov.uk/Topics/Statistics/Browse/School-Education/Publications

Statistics provided by the Scottish Government:  http://statistics.gov.scot/data/school-pupil-census

## License

Data is licensed under the Open Government License: http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2/

## Requirements

- NodeJS
- npm

## Installation

Clone the repository

```
git clone https://github.com/EdinburghCityScope/sg-school-pupil-census.git
```

Install npm dependencies

```
cd sg-school-pupil-census
npm install
```

Run the API (from the sg-school-pupil-census directory)

```
node .
```

Converting the extracted data into loopback data.

```
node scripts/featureCollectionToLoopbackJson.js
```

Re-build data files from the statistics.gov.scot API

```
node scripts/build-data.js
```
