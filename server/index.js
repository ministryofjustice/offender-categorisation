// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
require('./utils/azure-appinsights')

const createApp = require('./app')

const formClient = require('./data/formClient')
const nomisClientBuilder = require('./data/nomisClientBuilder')
const riskProfilerClientBuilder = require('./data/riskProfilerClientBuilder')

const createFormService = require('./services/formService')
const createOffendersService = require('./services/offendersService')
const createSignInService = require('./authentication/signInService')
const createUserService = require('./services/userService')
const createRiskProfilerService = require('./services/riskProfilerService')

// pass in dependencies of service
const formService = createFormService(formClient)
const offendersService = createOffendersService(nomisClientBuilder, formService)
const userService = createUserService(nomisClientBuilder)
const riskProfilerService = createRiskProfilerService(riskProfilerClientBuilder)

const app = createApp({
  formService,
  offendersService,
  signInService: createSignInService(),
  userService,
  riskProfilerService,
})

module.exports = app
