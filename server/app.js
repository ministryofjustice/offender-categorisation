const express = require('express')
const addRequestId = require('express-request-id')()
const moment = require('moment')
const path = require('path')
const bunyanRequestLogger = require('bunyan-request-logger')
const helmet = require('helmet')
const csurf = require('csurf')
const compression = require('compression')
const passport = require('passport')
const bodyParser = require('body-parser')
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)

const sassMiddleware = require('node-sass-middleware')
const catToolSerialisers = require('./catToolSerialisers')
const auth = require('./authentication/auth')
const healthFactory = require('./services/healthCheck')
const createHomeRouter = require('./routes/home')
const createFormRouter = require('./routes/form')
const createTasklistRouter = require('./routes/tasklist')
const createTasklistRecatRouter = require('./routes/tasklistRecat')
const authorisationMiddleware = require('./middleware/authorisationMiddleware')
const logger = require('../log.js')
const nunjucksSetup = require('./utils/nunjucksSetup')
const config = require('../server/config')
const createOpenConditionsRouter = require('./routes/openConditions')
const createRecatRouter = require('./routes/recat')

const log = bunyanRequestLogger({ name: 'Cat tool http', serializers: catToolSerialisers })
const { authenticationMiddleware } = auth

const version = moment.now().toString()
const production = process.env.NODE_ENV === 'production'
const testMode = process.env.NODE_ENV === 'test'

module.exports = function createApp({
  signInService,
  formService,
  offendersService,
  userService,
  riskProfilerService,
  statsService,
}) {
  const app = express()

  auth.init(signInService)

  app.set('json spaces', 2)

  // Configure Express for running behind proxies
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true)

  // View Engine Configuration
  app.set('view engine', 'html')

  nunjucksSetup(app, path)

  // Server Configuration
  app.set('port', process.env.PORT || 3000)

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  app.use(helmet())

  app.use(addRequestId)

  const client = redis.createClient({
    port: config.redis.port,
    password: config.redis.auth_token,
    host: config.redis.host,
    tls: config.redis.tls_enabled ? { checkServerIdentity: () => undefined } : false, // no ssl currently + local redis image requires false instead of object
  })

  app.use(
    session({
      name: 'session',
      store: new RedisStore({ client }),
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: true,
    })
  )

  app.use(passport.initialize())
  app.use(passport.session())

  // Request Processing Configuration
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(log.requestLogger())

  // Resource Delivery Configuration
  app.use(compression())

  // Cachebusting version string
  if (production) {
    // Version only changes on reboot
    app.locals.version = version
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = moment.now().toString()
      return next()
    })
  }

  if (!production) {
    app.use(
      '/assets',
      sassMiddleware({
        src: path.join(__dirname, '../assets/sass'),
        dest: path.join(__dirname, '../assets/stylesheets'),
        debug: true,
        outputStyle: 'compressed',
        indentedSyntax: true,
        prefix: '/stylesheets/',
        includePaths: ['node_modules/govuk-frontend/govuk', 'node_modules/@ministryofjustice'],
      })
    )
  }

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration * 1000 }

  ;[
    '../assets',
    '../assets/stylesheets',
    '../node_modules/govuk-frontend/govuk/assets',
    '../node_modules/govuk-frontend/govuk',
  ].forEach(dir => {
    app.use('/assets', express.static(path.join(__dirname, dir), cacheControl))
  })
  ;['../node_modules/govuk_frontend_toolkit/images'].forEach(dir => {
    app.use('/assets/images/icons', express.static(path.join(__dirname, dir), cacheControl))
  })
  app.use('/favicon.ico', express.static(path.join(__dirname, '../assets/images/favicon.ico'), cacheControl))

  const health = healthFactory(config.apis.oauth2.url, config.apis.elite2.url, config.apis.riskProfiler.url)
  app.get('/health', (req, res, next) => {
    health((err, result) => {
      if (err) {
        return next(err)
      }
      if (!(result.status === 'UP')) {
        res.status(503)
      }
      res.json(result)
      return result
    })
  })

  // GovUK Template Configuration
  app.locals.asset_path = '/assets/'

  function addTemplateVariables(req, res, next) {
    res.locals.user = req.user
    res.locals.currentRole = req.session && req.session.currentRole
    next()
  }

  app.use(addTemplateVariables)

  // Don't cache dynamic resources
  app.use(helmet.noCache())

  // CSRF protection
  if (!testMode) {
    app.use(csurf())
  }

  // JWT token refresh
  app.use(async (req, res, next) => {
    if (req.user) {
      const timeToRefresh = new Date() > req.user.refreshTime
      if (timeToRefresh) {
        try {
          const newToken = await signInService.getRefreshedToken(req.user)
          req.user.token = newToken.token
          req.user.refreshToken = newToken.refreshToken
          logger.info(`existing refreshTime in the past by ${new Date() - req.user.refreshTime}`)
          logger.info(
            `updating time by ${newToken.refreshTime - req.user.refreshTime} from ${req.user.refreshTime} to ${
              newToken.refreshTime
            }`
          )
          req.user.refreshTime = newToken.refreshTime
        } catch (error) {
          logger.error(`Token refresh error: ${req.user.username}`, error.stack)
          return res.redirect('/logout')
        }
      }
    }
    return next()
  })

  // Update a value in the cookie so that the set-cookie will be sent.
  // Only changes every minute so that it's not sent with every request.
  app.use((req, res, next) => {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
    next()
  })

  const authLogoutUrl = `${config.apis.oauth2.externalUrl}/logout?client_id=${config.apis.oauth2.apiClientId}&redirect_uri=${config.domain}`

  app.get('/autherror', (req, res) => {
    res.status(401)
    return res.render('autherror')
  })

  app.get('/login', passport.authenticate('oauth2'))

  app.get('/login/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo || '/',
      failureRedirect: '/autherror',
    })(req, res, next)
  )

  app.use('/logout', (req, res) => {
    if (req.user) {
      req.logout()
      req.session.destroy()
    }
    res.redirect(authLogoutUrl)
  })

  app.use(authorisationMiddleware(userService, offendersService))

  const homeRouter = createHomeRouter({
    userService,
    offendersService,
    authenticationMiddleware,
    statsService,
    formService,
  })
  app.use('/', homeRouter)
  app.use(
    '/tasklist/',
    createTasklistRouter({ formService, offendersService, userService, authenticationMiddleware, riskProfilerService })
  )
  app.use(
    '/tasklistRecat/',
    createTasklistRecatRouter({
      formService,
      offendersService,
      userService,
      authenticationMiddleware,
      riskProfilerService,
    })
  )

  const openConditionsRouter = createOpenConditionsRouter({
    formService,
    offendersService,
    userService,
    authenticationMiddleware,
  })
  app.use('/form/openConditions/', openConditionsRouter)

  const recatRouter = createRecatRouter({
    formService,
    offendersService,
    userService,
    riskProfilerService,
    authenticationMiddleware,
  })
  app.use('/form/recat/', recatRouter)

  const formRouter = createFormRouter({
    formService,
    offendersService,
    userService,
    riskProfilerService,
    authenticationMiddleware,
  })
  app.use('/form/', formRouter)
  app.use('/supervisor/', formRouter)

  app.use((req, res, next) => {
    next(new Error('Not found'))
  })

  app.use(renderErrors)

  return app
}

// eslint-disable-next-line no-unused-vars
function renderErrors(error, req, res, next) {
  // NOTE 'next' param MUST be included so that express recognises this as an error handler

  logger.error(error)

  // code to handle unknown errors
  const prodMessage = 'Something went wrong. The error has been logged. Please try again'
  if (error.response) {
    res.locals.error = error.response.error
    res.locals.message = production ? prodMessage : error.response.res.statusMessage
  } else {
    res.locals.error = error
    res.locals.message = production ? prodMessage : error.message
  }
  res.status(error.status || 500)

  res.render('pages/error')
}
