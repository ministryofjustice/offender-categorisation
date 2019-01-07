const createApp = require('./app')

const formClient = require('./data/formClient')
const custodyClientBuilder = require('./data/custodyClientBuilder')

const createFormService = require('./services/formService')
const createOffendersService = require('./services/offendersService')
const createSignInService = require('./authentication/signInService')

// pass in dependencies of service
const formService = createFormService(formClient)
const offendersService = createOffendersService(custodyClientBuilder)

const app = createApp({
  formService,
  offendersService,
  signInService: createSignInService(),
})

module.exports = app
