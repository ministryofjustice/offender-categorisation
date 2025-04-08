// @ts-check

require('dotenv').config()
const logger = require('../log').default

const production = process.env.NODE_ENV === 'production'

/**
 * Retrieves an environment variable value or falls back to a default.
 *
 * @param {string} name - The name of the environment variable to retrieve
 * @param {string | number | string[]} fallback - A fallback value if the environment variable is not set
 * @param {boolean} [log=false] - Whether to log the retrieval process
 * @param {Object} [options={}] - Additional options
 * @param {boolean} [options.requireInProduction=false] - If `true`, requires the variable in production and prevents fallback
 * @throws {Error} Throws an error if the variable is missing and no fallback is provided
 * @returns {any} - The environment variable value, the fallback, or an error if neither is available
 */
function get(name, fallback, log = false, options = {}) {
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
  environment: process.env.ENVIRONMENT || 'local',
  redis: {
    tls_enabled: get('REDIS_TLS_ENABLED', 'false', true),
    port: get('REDIS_PORT', 6379, true),
    host: get('REDIS_HOST', '127.0.0.1', true),
    auth_token: process.env.REDIS_AUTH_TOKEN,
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', false, { requireInProduction: true }),
    ttl: get('SESSION_TTL', 1200, true),
  },

  expiryMinutes: get('WEB_SESSION_TIMEOUT_IN_MINUTES', '120', true),
  staticResourceCacheDuration: get('STATIC_RESOURCE_TIMEOUT_IN_MINUTES', '0', true),
  db: {
    username: get('DB_USER', 'form-builder', true),
    password: get('DB_PASS', 'form-builder', false),
    server: get('DB_SERVER', 'localhost', true),
    database: get('DB_NAME', 'form-builder', true),
    sslEnabled: get('DB_SSL_ENABLED', 'false', true),
  },
  sqs: {
    riskProfiler: {
      queueUrl: get('RP_QUEUE_URL', 'http://localhost:4566/000000000000/risk_profiler_change', false, {
        requireInProduction: true,
      }),
      accessKeyId: get('RP_QUEUE_ACCESS_KEY_ID', null, false),
      secretAccessKey: get('RP_QUEUE_SECRET_ACCESS_KEY', null, false),
      dlq: {
        queueUrl: get('RP_DL_QUEUE_URL', 'http://localhost:4566/000000000000/risk_profiler_change_dlq', false, {
          requireInProduction: true,
        }),
        accessKeyId: get('RP_DL_QUEUE_ACCESS_KEY_ID', null, false),
        secretAccessKey: get('RP_DL_QUEUE_SECRET_ACCESS_KEY', null, false),
      },
    },
    event: {
      queueUrl: get('EVENT_QUEUE_URL', 'http://localhost:4566/000000000000/event', true),
      accessKeyId: get('EVENT_QUEUE_ACCESS_KEY_ID', null, false),
      secretAccessKey: get('EVENT_QUEUE_SECRET_ACCESS_KEY', null, false),
      dlq: {
        queueUrl: get('EVENT_DL_QUEUE_URL', 'http://localhost:4566/000000000000/event_dlq', false, {
          requireInProduction: true,
        }),
        accessKeyId: get('EVENT_DL_QUEUE_ACCESS_KEY_ID', null, false),
        secretAccessKey: get('EVENT_DL_QUEUE_SECRET_ACCESS_KEY', null, false),
      },
    },
    enabled: get('SQS_ENABLED', 'true', true),
  },
  apis: {
    oauth2: {
      url: authUrl,
      externalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth', true), true),
      manageAccountUrl: `${authUrl}/account-details`,
      timeout: {
        response: 30000,
        deadline: 35000,
      },
      apiClientId: get('API_CLIENT_ID', 'categorisationtool', true),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', false),
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
    risksAndNeeds: {
      url: get('RISKS_AND_NEEDS_ENDPOINT_URL', 'http://localhost:8086/', true),
      timeout: {
        response: get('RISKS_AND_NEEDS_ENDPOINT_URL_RESPONSE', 30000, true),
        deadline: get('RISKS_AND_NEEDS_ENDPOINT_URL_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    probationOffenderSearch: {
      url: get('PROBATION_OFFENDER_SEARCH_ENDPOINT_URL', 'http://localhost:8087/', true),
      timeout: {
        response: get('PROBATION_OFFENDER_SEARCH_ENDPOINT_URL_RESPONSE', 30000, true),
        deadline: get('PROBATION_OFFENDER_SEARCH_ENDPOINT_URL_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    offenderCategorisationApi: {
      url: get('OFFENDER_CATEGORISATION_API_ENDPOINT_URL', 'http://localhost:8088/', true),
      timeout: {
        response: get('OFFENDER_CATEGORISATION_API_ENDPOINT_URL_RESPONSE', 30000, true),
        deadline: get('OFFENDER_CATEGORISATION_API_ENDPOINT_URL_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    frontendComponents: {
      url: get('COMPONENT_API_URL', 'http://localhost:8085/components', true),
      timeout: {
        response: Number(get('COMPONENT_API_TIMEOUT_RESPONSE', 20000, true)),
        deadline: Number(get('COMPONENT_API_TIMEOUT_DEADLINE', 20000, true)),
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
  supportUrl: `${get('SUPPORT_URL', 'http://localhost:3000/', true)}`,
  googleTagManagerTag: `${get('GOOGLE_TAG_MANAGER_TAG', ' ', true)}`,
  approvedDisplayMonths: `${get('APPROVED_DISPLAY_MONTHS', 6, true)}`,
  recatMarginMonths: `${get('RECAT_MARGIN_MONTHS', 2, true)}`,
  femalePrisonIds: `${get(
    'FEMALE_PRISON_IDS',
    ['AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI'],
    true,
  )}`,
  https: production,
  productId: get('PRODUCT_ID', 'UNASSIGNED', true, { requireInProduction: true }),
  featureFlags: {
    events: {
      offender_release: {
        enable_pending_categorisation_deletion: get('FEATURE_FLAG__EVENT__DELETE_PENDING_RECATS', 'false', true, {
          requireInProduction: false,
        }),
      },
    },
    // TODO deprecate after enabling
    policy_change: {
      three_to_five: get('FEATURE_FLAG__EVENT__3_TO_5_POLICY_CHANGE', 'false', true, {
        requireInProduction: false,
      }),
    },
  },
  appInsightsConnectionString: get('APPLICATIONINSIGHTS_CONNECTION_STRING', '', true, { requireInProduction: true }),
}
