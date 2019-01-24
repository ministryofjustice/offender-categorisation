const createApp = require('./app')

const formClient = require('./data/formClient')
const nomisClientBuilder = require('./data/nomisClientBuilder')

const createFormService = require('./services/formService')
const createOffendersService = require('./services/offendersService')
const createSignInService = require('./authentication/signInService')
const createUserService = require('./services/userService')

// pass in dependencies of service
const formService = createFormService(formClient)
const offendersService = createOffendersService(nomisClientBuilder, formService)
const userService = createUserService(nomisClientBuilder)

const app = createApp({
  formService,
  offendersService,
  signInService: createSignInService(),
  userService,
})

module.exports = app
