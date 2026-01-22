# Offender Categorisation

> A digital service for categorising prisoners

[![CircleCI](https://circleci.com/gh/ministryofjustice/offender-categorisation/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/offender-categorisation/tree/main)
[![Known Vulnerabilities](https://snyk.io/test/github/ministryofjustice/offender-categorisation/badge.svg)](https://snyk.io/test/github/ministryofjustice/offender-categorisation)
[![Ministry of Justice Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/offender-categorisation/badge)](https://github-community.service.justice.gov.uk/repository-standards/offender-categorisation)

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

## Dev Website

https://dev.offender-categorisation.service.justice.gov.uk/

## Requirements

You will need the following tools installed:

|      Tool      |   Version   |                               Reason                               |
| :------------: | :---------: | :----------------------------------------------------------------: |
|      npm       |  &ge;9.5.x  | Node package manager for resolving/installing project dependencies |
|      node      | &ge;18.17.x |                         NodeJS interpreter                         |
|     docker     |  &ge;18.x   |          Installing/removing/managing containers & images          |
| docker-compose | &ge;1.25.x  |      Convenience utility for grouped management of containers      |

## Getting started

Offender-Categorisation is a nodeJS application which by default starts up and listens on URL http://localhost:3000

It has services on which it depends :

|              Dependency               | Description                                            | Default                                                             | Override Env Var                              |
| :-----------------------------------: | :----------------------------------------------------- | :------------------------------------------------------------------ | :-------------------------------------------- |
|              prison-api               | Nomis API providing prisons/offender information       | http://localhost:8080                                               | ELITE2API_ENDPOINT_URL                        |
|              hmpps-auth               | OAuth2 API server for authenticating requests          | http://localhost:9090/auth                                          | NOMIS_AUTH_EXTERNAL_URL<br>NOMIS_AUTH_URL     |
|             risk-profiler             | Risk Profiler service                                  | http://localhost:8082/                                              | RISK_PROFILER_ENDPOINT_URL                    |
|          allocation-manager           | Allocation manager                                     | http://localhost:8083/                                              | ALLOCATION_MANAGER_ENDPOINT_URL               |
|        postgres (form-builder)        | PostgreSQL database server for offender-categorisation | jdbc:postgresql://localhost:5432/form-builder                       | DB_USER<br>DB_PASS<br>DB_SERVER<br>DB_NAME    |
|       postgres (risk profiler)        | PostgreSQL database server for risk-profiler           | jdbc:postgresql://localhost:5433/<DB_NAME>                          | Uses port forwarding<br>DB_NAME found in Lens |
|                 redis                 | Redis cache for user 'session' data (roles)            | localhost:6379/tcp                                                  |                                               |
|              SQS (event)              | AWS SQS queue for events                               | http://localhost:4566<br>Name: event<br>(localstack)                | EVENT_QUEUE_URL                               |
|          SQS (Risk Profiler)          | AWS SQS queue for risk profiler change events          | http://localhost:4566<br>Name: risk_profiler_change<br>(localstack) | RP_QUEUE_URL                                  |
|        SQS (event dead letter)        | AWS SQS queue for events dead letter                   | http://localhost:4566<br>Name: event<br>(localstack)                | EVENT_DL_QUEUE_URL                            |
| SQS (Risk Profiler dead letter queue) | AWS SQS queue for risk profiler dead letter            | http://localhost:4566<br>Name: events_dlq<br>(localstack)           | RP_DL_QUEUE_URL                               |
|              ingress url              |                                                        | http://localhost:3000/                                              | INGRESS_URL                                   |
|                dps url                |                                                        | http://localhost:3000/                                              | DPS_URL                                       |

## Other configuration

| Environment variable    | Default value                                                                        |
| :---------------------- | :----------------------------------------------------------------------------------- |
| GOOGLE_TAG_MANAGER_TAG  | (blank)                                                                              |
| APPROVED_DISPLAY_MONTHS | 6                                                                                    |
| RECAT_MARGIN_MONTHS     | 2                                                                                    |
| FEMALE_PRISON_IDS       | ['AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI'] |

## Docker compose files

|          File           |                                                Purpose                                                |
| :---------------------: | :---------------------------------------------------------------------------------------------------: |
|   docker-compose.yml    | Creates containers for all dependent services and all allows selective start, or override by env vars |
| docker-compose-test.yml |                              Sets up all containers for running locally                               |

## Running the application

The offender-categorisation can be run in two ways.

`Simplest way to run locally`

- if you have a high-spec machine
- if you are unable to connect to remote services

Set up port-forwarding by following the instructions here: <https://dsdmoj.atlassian.net/wiki/spaces/SED/pages/3930816517/Port+Forwarding+-+Developer+Instructions>

Use docker compose to download and run the four required containers

`docker-compose -f docker-compose-test.yml pull`

`docker-compose -f docker-compose-test.yml up`

Either set the environment variable `SQS_ENABLED=false` or make sure all the SQS queues have started up in the categorisation-localstack container and categorisation-localstack-setup container has exited

Install dependencies using `npm run setup`

Run the application using `npm run start`

### Note for M4 (Apple Silicon) CPU users

If you're using an M4 (Apple Silicon) Mac, the `nomis-oauth2-server` container may crash with the following error:

`[error occurred during error reporting (), id 0x5, SIGTRAP (0x5) at pc=0x0000ffff9cb771ec]`

To fix this, add the following environment variable to the `nomis-oauth2-server` service in your `docker-compose.yml`:

```yaml
environment:
  - JAVA_TOOL_OPTIONS=-XX:UseSVE=0
```

`Alternative way`

Run redis as a local docker container on the default port of 6379 when running the app locally with tls disabled (the default)

`docker run -p6379:6379 redis`

The other option is to run stunnel and port forward using the cloud platform guidance:
`https://github.com/ministryofjustice/cloud-platform-terraform-elasticache-cluster`
If running locally against elasticache with `TLS_ENABLED='true'` you will also need to provide the following env vars:

```bash
REDIS_AUTH_TOKEN=<from the namespace secret>
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Install dependencies

```bash
npm install
```

Run the application

```bash
npm run start
```

#### Notes:

#### Transactions

This app is transactional for Postgres database operations but NOT elite2 calls. So it is vital that router endpoints do all db calls BEFORE elite2 (updating) calls.
Otherwise when an error occurs, Nomis could get updated with the corresponding postgres changes being rolled back.

#### Users

You can log in with users stored in the seeded nomis oauth db e.g. `CA_USER, password123456`

#### Dependencies

The app authenticates using nomis `Nomis Oauth2 Server` and saves to a Postgres database.

The app uses redis (cloud platform elasticache when deployed to our environments) to store the user session.

#### Env variables

In config.js you can see all the required variables. These are set with defaults that will allow the application to run, but you will need to add a `.env` file at some point.

#### Run the node application

```bash
npm run start
```

#### Run linter

To automate the checking of the source code for programmatic and stylistic errors run lint using:

```bash
npm run lint
```

## Running the tests

### Unit Tests

To run the jest unit tests:

```bash
npm run test
```

### Running Cypress integration tests

For local running, start a test db, redis, and wiremock instance by:

`docker-compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either, run tests in headless mode with:

`npm run int-test`

Or run tests with the cypress UI:

`npm run int-test-ui`
