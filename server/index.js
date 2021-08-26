// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
require('./utils/azure-appinsights')

const createApp = require('./app')

const formClient = require('./data/formClient')
const statsClient = require('./data/statsClient')
const nomisClientBuilder = require('./data/nomisClientBuilder')
const riskProfilerClientBuilder = require('./data/riskProfilerClientBuilder')
const allocationClientBuilder = require('./data/allocationManagerApi')

const createFormService = require('./services/formService')
const createStatsService = require('./services/statsService')
const createOffendersService = require('./services/offendersService')
const createSignInService = require('./authentication/signInService')
const createUserService = require('./services/userService')
const createRiskProfilerService = require('./services/riskProfilerService')
const createSqsService = require('./services/sqsService')

// pass in dependencies of service
const formService = createFormService(formClient)
const statsService = createStatsService(statsClient)
const offendersService = createOffendersService(nomisClientBuilder, allocationClientBuilder, formService)
const userService = createUserService(nomisClientBuilder)
const riskProfilerService = createRiskProfilerService(riskProfilerClientBuilder)
const sqsService = createSqsService(offendersService, formService)

const app = createApp({
  formService,
  offendersService,
  signInService: createSignInService(),
  userService,
  riskProfilerService,
  statsService,
})

module.exports = { app, sqsService }
