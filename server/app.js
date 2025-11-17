const express = require('express')
const addRequestId = require('express-request-id')()
const moment = require('moment')
const path = require('path')
const noCache = require('nocache')
const csurf = require('csurf')
const compression = require('compression')
const passport = require('passport')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
require('./catToolSerialisers') // do not remove, logging requires it!
const auth = require('./authentication/auth').default
const healthFactory = require('./services/healthCheck')
const createHomeRouter = require('./routes/home')
const createFormRouter = require('./routes/form')
const createTasklistRouter = require('./routes/tasklist')
const createTasklistRecatRouter = require('./routes/tasklistRecat')
const authorisationMiddleware = require('./middleware/authorisationMiddleware')
const getFrontEndComponentsMiddleware = require('./middleware/dpsFrontEndComponentsMiddleware')
const setUpEnvironmentName = require('./utils/setUpEnvironmentName')
const setUpWebSecurity = require('./utils/setUpWebSecurity')
const nunjucksSetup = require('./utils/nunjucksSetup')
const { config } = require('./config')
const createOpenConditionsRouter = require('./routes/openConditions')
const createRecatRouter = require('./routes/recat')
const createNextReviewDateRouter = require('./routes/nextReviewDate')
const createLiteCategoriesRouter = require('./routes/liteCategories')
const errorHandler = require('./errorHandler')
const featureFlagMiddleware = require('./middleware/featureFlagMiddleware')

const { authenticationMiddleware } = auth

const version = moment.now().toString()
const production = process.env.NODE_ENV === 'production'
const testMode = process.env.NODE_ENV === 'test'

module.exports = function createApp({
  formService,
  offendersService,
  userService,
  riskProfilerService,
  statsService,
  frontEndComponentsService,
  pathfinderService,
  alertService,
}) {
  const app = express()

  // Authentication Configuration
  auth.init()

  app.set('json spaces', 2)
  // Configure Express for running behind proxies
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true)
  // Server Configuration
  app.set('port', process.env.PORT || 3000)

  app.get('/ping', (req, res) => {
    return res.send('pong')
  })

  // View Engine Configuration
  app.set('view engine', 'html')

  setUpEnvironmentName(app)
  nunjucksSetup(app, path)
  app.use(setUpWebSecurity())
  app.use(addRequestId)

  // should be moved to setUpWebSession middleware
  const client = redis.createClient({
    port: config.redis.port,
    password: config.redis.auth_token,
    host: config.redis.host,
    tls: config.redis.tls_enabled === 'true' ? {} : false,
  })

  app.use(
    session({
      name: 'session',
      store: new RedisStore({ client }),
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: true,
    }),
  )

  // Authentication strategy using Oauth2
  app.use(passport.initialize())
  app.use(passport.session())

  // Request Processing Configuration
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

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

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration * 1000 }

  ;[
    '/assets',
    '/assets/stylesheets',
    '/assets/js',
    '/node_modules/govuk-frontend/dist/govuk/assets',
    '/node_modules/govuk-frontend/dist',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
    '/node_modules/@microsoft/applicationinsights-web/dist/es5',
    '/node_modules/@microsoft/applicationinsights-clickanalytics-js/dist/es5',
  ].forEach(dir => {
    app.use('/assets', express.static(path.join(process.cwd(), dir), cacheControl))
  })
  ;['/node_modules/govuk_frontend_toolkit/images'].forEach(dir => {
    app.use('/assets/images/icons', express.static(path.join(process.cwd(), dir), cacheControl))
  })
  app.use('/favicon.ico', express.static(path.join(process.cwd(), '/assets/images/favicon.ico'), cacheControl))

  app.use(
    '/assets/js/jquery.min.js',
    express.static(path.join(process.cwd(), '/node_modules/jquery/dist/jquery.min.js'), cacheControl),
  )
  app.use(
    '/assets/moj-frontend/moj/all.js',
    express.static(path.join(process.cwd(), '/node_modules/@ministryofjustice/frontend/moj/all.js'), cacheControl),
  )

  const health = healthFactory(
    config.apis.oauth2.url,
    config.apis.elite2.url,
    config.apis.riskProfiler.url,
    config.apis.allocationManager.url,
    config.apis.prisonerSearch.url,
    config.apis.pathfinderApi.url,
    config.apis.alertsApi.url,
    config.apis.adjudicationsApi.url,
  )
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
  app.locals.asset_path = '/dist/assets/'

  function addTemplateVariables(req, res, next) {
    res.locals.user = req.user
    res.locals.currentRole = req.session && req.session.currentRole
    next()
  }

  app.use(addTemplateVariables)

  // Don't cache dynamic resources
  app.use(noCache())

  // CSRF protection
  if (!testMode) {
    app.use(csurf())
  }

  // Update a value in the cookie so that the set-cookie will be sent.
  // Only changes every minute so that it's not sent with every request.
  app.use((req, res, next) => {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
    next()
  })

  app.use(cookieParser())
  app.use(featureFlagMiddleware)

  const authLogoutUrl = `${config.apis.oauth2.externalUrl}/logout?client_id=${config.apis.oauth2.authCodeClientId}&redirect_uri=${config.domain}`

  app.get('/autherror', (req, res) => {
    res.status(401)
    return res.render('autherror')
  })

  app.get('/accessibility-statement', async (req, res) => {
    const user = await userService.getUser(res.locals)
    return res.render('accessibility-statement', { user })
  })

  // TODO move to setUpAuthentication middleware
  app.get('/login', passport.authenticate('oauth2'))

  app.get('/login/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo || '/',
      failureRedirect: '/autherror',
    })(req, res, next),
  )

  // session.destroy() is called on sign-out
  app.use('/sign-out', (req, res, next) => {
    if (req.user) {
      req.logout(err => {
        if (err) return next(err)
        return req.session.destroy(() => res.redirect(authLogoutUrl))
      })
    } else {
      res.redirect(authLogoutUrl)
    }
  })

  app.use(authorisationMiddleware(userService, offendersService))
  app.use(getFrontEndComponentsMiddleware(frontEndComponentsService))

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
    createTasklistRouter({
      formService,
      offendersService,
      userService,
      authenticationMiddleware,
      pathfinderService,
      alertService,
    }),
  )
  app.use(
    '/tasklistRecat/',
    createTasklistRecatRouter({
      formService,
      offendersService,
      userService,
      authenticationMiddleware,
      pathfinderService,
      alertService,
    }),
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
    pathfinderService,
    alertService,
    authenticationMiddleware,
  })
  app.use('/form/recat/', recatRouter)

  const nextReviewDateRouter = createNextReviewDateRouter({
    formService,
    offendersService,
    userService,
    authenticationMiddleware,
  })
  app.use('/form/nextReviewDate/', nextReviewDateRouter)

  const liteCategoriesRouter = createLiteCategoriesRouter({
    formService,
    offendersService,
    userService,
    authenticationMiddleware,
  })
  app.use('/liteCategories/', liteCategoriesRouter)

  const formRouter = createFormRouter({
    formService,
    offendersService,
    userService,
    authenticationMiddleware,
    pathfinderService,
    alertService,
  })
  app.use('/form/', formRouter)
  app.use('/supervisor/', formRouter)

  app.use((req, res, next) => {
    next(new Error('Not found'))
  })

  app.use(errorHandler(production))

  return app
}
