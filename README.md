# offender-categorisation
A digital service for categorising prisoners

# Dev Website
https://dev.offender-categorisation.service.justice.gov.uk/

# Based on GOVUK startkit

A simple starter kit to start writing node app with the gov uk front end toolkit.


## Getting started
The easiest way to get started is to use docker compose to download and run the three required containers.

`docker-compose pull`

`docker-compose up`

for detailed instructions see `https://dsdmoj.atlassian.net/wiki/spaces/NFS/overview`

### Transactions
This app is transactional for Postgres database operations but NOT elite2 calls. So it is vital that router endpoints do all db calls BEFORE elite2 (updating) calls.
Otherwise when an error occurs, Nomis could get updated with the corresponding postgres changes being rolled back.

###Users
You can log in with users stored int eh seeded nomis oauth db e.g. `CA_USER, password123456`

### Dependencies
The app authenticates using nomis `Nomis Oauth2 Server` and saves to a Postgres database.

The app uses redis (cloud platform elasticache when deployed to our environments) to store the user session.

### Running the app for development**

#### Local Redis
Run redis as a local docker container on the default port of 6379 when running the app locally with tls disabled (the default)
`docker run -p6379:6379 redis`

The other option is to run stunnel and port forward using the cloud platform guidance:
`https://github.com/ministryofjustice/cloud-platform-terraform-elasticache-cluster`
If running locally against elasticache with `TLS_ENABLED='true'` you will also need to provide the following env vars:
REDIS_AUTH_TOKEN=<from the namespace secret>
NODE_TLS_REJECT_UNAUTHORIZED=0

#### Build assets
`npm run build`

Install dependencies using `npm install` ensure you are using >= `Node v8.4.0`

#### Env variables
In config.js you can see all the required variables. These are set with defaults that will allow the application to run, but you will need to add a `.env` file at some point.


`npm run start`


### Run linter

`npm run lint`

### Run tests

`npm run test`

