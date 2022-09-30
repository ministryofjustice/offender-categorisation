# Offender Categorisation

> A digital service for categorising prisoners

[![CircleCI](https://circleci.com/gh/ministryofjustice/offender-categorisation/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/offender-categorisation/tree/main)
[![Docker Repository on Quay](https://img.shields.io/badge/quay.io-repository-2496ED.svg?logo=docker)](https://quay.io/repository/hmpps/offender-categorisation)
[![Known Vulnerabilities](https://snyk.io/test/github/ministryofjustice/offender-categorisation/badge.svg)](https://snyk.io/test/github/ministryofjustice/offender-categorisation)
[![Repo Standards Badge](https://img.shields.io/badge/dynamic/json?color=blue&style=flat&logo=github&label=MoJ%20Compliant&query=%24.data%5B%3F%28%40.name%20%3D%3D%20%22offender-categorisation%22%29%5D.status&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fgithub_repositories)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/github_repositories#offender-categorisation "Link to report")

<!-- [![License: ##](https://img.shields.io/badge/License-##-lightgrey.svg)](https://opensource.org/licenses/##) -->

[![JS](https://img.shields.io/badge/JavaScript-323330?style=flat&logo=javascript&logoColor=F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=flat&logo=npm&logoColor=white)](https://www.npmjs.com)
[![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=Node.js&logoColor=fff)](https://nodejs.org/en/)
[![ExpressJS](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express)](https://expressjs.com/)
[![Jest](https://img.shields.io/badge/-Jest-C21325?style=postgres&logo=Jest&logoColor=fff)](https://jestjs.io/)
[![ESLint](https://img.shields.io/badge/-ESLint-4B32C3?logo=ESLint&logoColor=fff)](https://eslint.org/)

[![AWS](https://img.shields.io/badge/-Amazon%20AWS-232F3E?logo=Amazonaws&logoColor=amazonorange)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/-Docker-000?logo=docker)](https://www.docker.com)
[![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=postgres&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=flat&logo=redis&logoColor=white)](https://redis.io/)

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

### Users

You can log in with users stored in the seeded nomis oauth db e.g. `CA_USER, password123456`

### Dependencies

The app authenticates using nomis `Nomis Oauth2 Server` and saves to a Postgres database.

The app uses redis (cloud platform elasticache when deployed to our environments) to store the user session.

### Running the app for development

#### Local Redis

Run redis as a local docker container on the default port of 6379 when running the app locally with tls disabled (the default)

`docker run -p6379:6379 redis`

The other option is to run stunnel and port forward using the cloud platform guidance:
`https://github.com/ministryofjustice/cloud-platform-terraform-elasticache-cluster`
If running locally against elasticache with `TLS_ENABLED='true'` you will also need to provide the following env vars:

```bash
REDIS_AUTH_TOKEN=<from the namespace secret>
NODE_TLS_REJECT_UNAUTHORIZED=0
```

#### Build assets

`npm run build`

Install dependencies using `npm install`.

#### Env variables

In config.js you can see all the required variables. These are set with defaults that will allow the application to run, but you will need to add a `.env` file at some point.

`npm run start`

### Run linter

`npm run lint`

### Run tests

Run `docker-compose-test.yml`

#### Unit Tests

`npm run test`

#### Integration Tests

You will need *chromedriver.exe* on your path to run integration tests, see https://chromedriver.chromium.org/downloads.

Verification gradle tasks are provided to run the integration tests with or without a visible browser:

- chromeTest
- chromeHeadlessTest


These can be run in debug mode for troubleshooting.
