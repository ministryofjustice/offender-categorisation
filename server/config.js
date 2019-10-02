require('dotenv').config()
const logger = require('../log.js')

const production = process.env.NODE_ENV === 'production'

function get(name, fallback, log, options = {}) {
  if (process.env[name]) {
    if (log) {
      logger.info(`Env var: ${name} value: ${process.env[name]}`)
    }
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    if (log) {
      logger.info(`Env var: ${name} value: ${fallback}`)
    }
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

module.exports = {
  sessionSecret: get('SESSION_SECRET', 'app-insecure-default-session', false, { requireInProduction: true }),
  expiryMinutes: get('WEB_SESSION_TIMEOUT_IN_MINUTES', '120', true),
  staticResourceCacheDuration: get('STATIC_RESOURCE_TIMEOUT_IN_MINUTES', '0', true),
  db: {
    username: get('DB_USER', 'form-builder', true),
    password: get('DB_PASS', 'form-builder'),
    server: get('DB_SERVER', 'localhost', true),
    database: get('DB_NAME', 'form-builder', true),
    sslEnabled: get('DB_SSL_ENABLED', 'false', true),
  },
  sqs: {
    riskProfilerQueue: get('RP_QUEUE_URL', 'http://localhost:4576/queue/risk_profiler_change', true),
  },
  apis: {
    oauth2: {
      url: get('NOMIS_AUTH_URL', 'http://localhost:9090/auth', true),
      externalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth'), true),
      timeout: {
        response: 30000,
        deadline: 35000,
      },
      apiClientId: get('API_CLIENT_ID', 'categorisationtool', true),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret'),
    },
    elite2: {
      url: get('ELITE2API_ENDPOINT_URL', 'http://localhost:8080/', true),
      timeout: {
        response: get('ELITE2API_ENDPOINT_TIMEOUT_RESPONSE', 30000, true),
        deadline: get('ELITE2API_ENDPOINT_TIMEOUT_DEADLINE', 35000, true),
      },
    },
    riskProfiler: {
      url: get('RISK_PROFILER_ENDPOINT_URL', 'http://localhost:8082/', true),
      timeout: {
        response: get('RISK_PROFILER_ENDPOINT_TIMEOUT_RESPONSE', 30000, true),
        deadline: get('RISK_PROFILER_ENDPOINT_TIMEOUT_DEADLINE', 35000, true),
      },
    },
  },
  domain: `${get('INGRESS_URL', 'http://localhost:3000', true)}`,
  dpsUrl: `${get('DPS_URL', 'http://localhost:3000/', true)}`,
  googleAnalyticsId: `${get('GOOGLE_ANALYTICS_ID', ' ', true)}`,
  approvedDisplayMonths: `${get('APPROVED_DISPLAY_MONTHS', 6, true)}`,
  recatMarginMonths: `${get('RECAT_MARGIN_MONTHS', 2, true)}`,
  https: production,
}
