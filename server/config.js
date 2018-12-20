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
  db: {
    username: get('DB_USER', 'form-builder', true),
    password: get('DB_PASS', 'form-builder'),
    server: get('DB_SERVER', 'localhost', true),
    database: get('DB_NAME', 'form-builder', true),
    sslEnabled: get('DB_SSL_ENABLED', 'false', true),
  },
  nomis: {
    authUrl: get('NOMIS_AUTH_URL', 'http://localhost:8080/auth', true),
    authExternalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:8080/auth'), true),
    timeout: {
      response: 30000,
      deadline: 35000,
    },
    apiClientId: get('API_CLIENT_ID', 'licences', true),
    apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret'),
  },
  domain: `${get('INGRESS_URL', 'http://localhost:3000', true)}`,
}
