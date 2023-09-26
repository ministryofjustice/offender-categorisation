require('dotenv').config()
const logger = require('../log')

const production = process.env.NODE_ENV === 'production'

function get(name, fallback, log, options = {}) {
  if (process.env[name]) {
    if (log) {
      logger.info(`Env var: ${name} value: ${process.env[name]} `)
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

const authUrl = get('NOMIS_AUTH_URL', 'http://localhost:9090/auth', true)

module.exports = {
  redis: {
    tls_enabled: get('REDIS_TLS_ENABLED', 'false', true),
    port: get('REDIS_PORT', 6379, true),
    host: get('REDIS_HOST', '127.0.0.1', true),
    auth_token: process.env.REDIS_AUTH_TOKEN,
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', false, { requireInProduction: true }),
    ttl: get('SESSION_TTL', 1200),
  },

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
    riskProfiler: {
      queueUrl: get('RP_QUEUE_URL', 'http://localhost:4576/queue/risk_profiler_change', false, {
        requireInProduction: true,
      }),
      accessKeyId: get('RP_QUEUE_ACCESS_KEY_ID', null),
      secretAccessKey: get('RP_QUEUE_SECRET_ACCESS_KEY', null),
      dlq: {
        queueUrl: get('RP_DL_QUEUE_URL', 'http://localhost:4576/queue/risk_profiler_change_dlq', false, {
          requireInProduction: true,
        }),
        accessKeyId: get('RP_DL_QUEUE_ACCESS_KEY_ID', null),
        secretAccessKey: get('RP_DL_QUEUE_SECRET_ACCESS_KEY', null),
      },
    },
    event: {
      queueUrl: get('EVENT_QUEUE_URL', 'http://localhost:4576/queue/event', true),
      accessKeyId: get('EVENT_QUEUE_ACCESS_KEY_ID', null),
      secretAccessKey: get('EVENT_QUEUE_SECRET_ACCESS_KEY', null),
      dlq: {
        queueUrl: get('EVENT_DL_QUEUE_URL', 'http://localhost:4576/queue/event_dlq', false, {
          requireInProduction: true,
        }),
        accessKeyId: get('EVENT_DL_QUEUE_ACCESS_KEY_ID', null),
        secretAccessKey: get('EVENT_DL_QUEUE_SECRET_ACCESS_KEY', null),
      },
    },
    enabled: get('SQS_ENABLED', 'true', true),
  },
  apis: {
    oauth2: {
      url: authUrl,
      externalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth'), true),
      manageAccountUrl: `${authUrl}/account-details`,
      timeout: {
        response: 30000,
        deadline: 35000,
      },
      apiClientId: get('API_CLIENT_ID', 'categorisationtool', true),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret'),
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    elite2: {
      url: get('ELITE2API_ENDPOINT_URL', 'http://localhost:8080/', true),
      timeout: {
        response: get('ELITE2API_ENDPOINT_TIMEOUT_RESPONSE', 30000, true),
        deadline: get('ELITE2API_ENDPOINT_TIMEOUT_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    riskProfiler: {
      url: get('RISK_PROFILER_ENDPOINT_URL', 'http://localhost:8082/', true),
      timeout: {
        response: get('RISK_PROFILER_ENDPOINT_TIMEOUT_RESPONSE', 30000, true),
        deadline: get('RISK_PROFILER_ENDPOINT_TIMEOUT_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    allocationManager: {
      url: get('ALLOCATION_MANAGER_ENDPOINT_URL', 'http://localhost:8083/', true),
      timeout: {
        response: get('ALLOCATION_MANAGER_TIMEOUT_RESPONSE', 30000, true),
        deadline: get('ALLOCATION_MANAGER_TIMEOUT_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    prisonerSearch: {
      url: get('PRISONER_SEARCH_ENDPOINT_URL', 'http://localhost:8084/', true),
      timeout: {
        response: get('PRISONER_SEARCH_TIMEOUT_RESPONSE', 30000, true),
        deadline: get('PRISONER_SEARCH_TIMEOUT_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
  },
  domain: `${get('INGRESS_URL', 'http://localhost:3000', true)}`,
  dpsUrl: `${get('DPS_URL', 'http://localhost:3000/', true)}`,
  googleAnalyticsId: `${get('GOOGLE_ANALYTICS_ID', ' ', true)}`,
  approvedDisplayMonths: `${get('APPROVED_DISPLAY_MONTHS', 6, true)}`,
  recatMarginMonths: `${get('RECAT_MARGIN_MONTHS', 2, true)}`,
  femalePrisonIds: `${get(
    'FEMALE_PRISON_IDS',
    ['AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI'],
    true
  )}`,
  https: production,
  featureFlags: {
    dpsComponents: {
      header: get('FEATURE_FLAG_ENABLE_DPS_COMPONENT_HEADER', false, true),
      footer: get('FEATURE_FLAG_ENABLE_DPS_COMPONENT_FOOTER', false, true),
    },
  },
}
