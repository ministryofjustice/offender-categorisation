# categorisation-tool
A digital service for categorising prisoners

# Dev Website
https://categorisation-tool.apps.cloud-platform-live-0.k8s.integration.dsd.io/

# Based on GOVUK startkit

A simple starter kit to start writing node app with the gov uk front end toolkit.


## Getting started
The easiest way to get started is to use docker compose to download and run the three required containers. 

`docker-compose pull`

`docker-compose up`

for detailed instructions see `https://dsdmoj.atlassian.net/wiki/spaces/NFS/overview`

###Users
You can log in with users stored int eh seeded nomis oauth db e.g. `CA_USER, password123456`

### Dependencies
The app authenticates using nomis `Nomis Oauth2 Server` and saves to a Postgres database.

The app uses redis (cloud platform elasticache when deployed to our environments) to store the user session.
Run redis as a local docker container on the default port of 6379 when running the app locally
The other option is to run stunnel and port forward using the cloud platform guidance:
`https://github.com/ministryofjustice/cloud-platform-terraform-elasticache-cluster`
If running locally against elasticache you will also need to provide the following env vars:
REDIS_AUTH_TOKEN=<from the namespace secret>
NODE_TLS_REJECT_UNAUTHORIZED=0 

`docker run -p6379:6379 redis`

### Running the app for development**

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

