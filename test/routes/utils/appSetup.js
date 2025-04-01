const express = require('express')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const path = require('path')
const cookieParser = require('cookie-parser')
const nunjucksSetup = require('../../../server/utils/nunjucksSetup')
const errorHandler = require('../../../server/errorHandler')
const featureFlagMiddleware = require('../../../server/middleware/featureFlagMiddleware')

module.exports = (route, production = false) => {
  const app = express()

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
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use(featureFlagMiddleware)
  app.use('/', route)
  app.use((error, req, res, next) => {
    // eslint-disable-next-line no-console
    console.log(error)
    next(error)
  })
  app.use(errorHandler(production))
  return app
}
