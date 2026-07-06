const express = require('express')
const cookieSession = require('cookie-session')
const path = require('path')
const cookieParser = require('cookie-parser')
const nunjucksSetup = require('../../../server/utils/nunjucksSetup')
const errorHandler = require('../../../server/errorHandler')
const featureFlagMiddleware = require('../../../server/middleware/featureFlagMiddleware')
const setUpWebRequestParsing = require('../../../server/middleware/setUpRequestParsing').default

module.exports = (route, production = false) => {
  const app = express()
  app.set('query parser', 'extended')

  app.set('view engine', 'html')

  nunjucksSetup(app, path)

  app.use((req, res, next) => {
    req.user = {
      firstName: 'first',
      lastName: 'last',
      userId: 'id',
      token: 'token',
      username: 'CA_USER_TEST',
    }
    res.locals.user = { token: 'ABCDEF', username: 'me' }
    next()
  })
  app.use(cookieSession({ keys: [''] }))
  app.use(setUpWebRequestParsing())
  app.use(cookieParser())
  app.use(featureFlagMiddleware)
  app.use('/', route)
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    // eslint-disable-next-line no-console
    console.log(error)
    next(error)
  })
  app.use(errorHandler(production))
  return app
}
