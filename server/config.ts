/* eslint-disable no-console */
import dotenv from 'dotenv'

dotenv.config()

const production = process.env.NODE_ENV === 'production'

type FallbackValue = string | number | string[] | null

interface GetParams<T = FallbackValue> {
  name: string
  fallback: T
  log: boolean
  requireInProduction: boolean
}

const DEFAULT_TIMEOUTS = {
  response: 30000,
  deadline: 35000,
} as const

const DEFAULT_HTTP_AGENT = {
  maxSockets: 100,
  maxFreeSockets: 10,
  freeSocketTimeout: 30000,
} as const

const DEFAULT_FEMALE_PRISON_IDS = ['AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI']
const DEFAULT_FEMALE_PRISON_IDS_ENV = DEFAULT_FEMALE_PRISON_IDS.join(',')

const DEFAULTS = {
  // General environment
  ENVIRONMENT: 'local',

  // Redis config
  REDIS_TLS_ENABLED: 'false',
  REDIS_PORT: 6379,
  REDIS_HOST: '127.0.0.1',

  // Session
  SESSION_SECRET: 'app-insecure-default-session',
  SESSION_TTL: 1200,

  // General timeouts
  WEB_SESSION_TIMEOUT_IN_MINUTES: '120',
  STATIC_RESOURCE_TIMEOUT_IN_MINUTES: '0',

  // Database
  DB_USER: 'form-builder',
  DB_PASS: 'form-builder',
  DB_SERVER: 'localhost',
  DB_NAME: 'form-builder',
  DB_SSL_ENABLED: 'false',

  // SQS
  SQS_ENABLED: 'true',
  RP_QUEUE_URL: 'http://localhost:4566/000000000000/risk_profiler_change',
  RP_DL_QUEUE_URL: 'http://localhost:4566/000000000000/risk_profiler_change_dlq',

  // Event SQS
  EVENT_QUEUE_URL: 'http://localhost:4566/000000000000/event',
  EVENT_DL_QUEUE_URL: 'http://localhost:4566/000000000000/event_dlq',

  // OAuth
  NOMIS_AUTH_URL: 'http://localhost:9090/auth',
  NOMIS_AUTH_EXTERNAL_URL: 'http://localhost:9090/auth',
  AUTH_CODE_CLIENT_ID: 'categorisationtool',
  AUTH_CODE_CLIENT_SECRET: 'clientsecret',
  CLIENT_CREDS_CLIENT_ID: 'categorisation-tool-system-client-1',
  CLIENT_CREDS_CLIENT_SECRET: 'systemsecret',

  // API
  ELITE2API_ENDPOINT_URL: 'http://localhost:8080/',
  RISK_PROFILER_ENDPOINT_URL: 'http://localhost:8082/',
  ALLOCATION_MANAGER_ENDPOINT_URL: 'http://localhost:8083/',
  PRISONER_SEARCH_ENDPOINT_URL: 'http://localhost:8084/',
  RISKS_AND_NEEDS_ENDPOINT_URL: 'http://localhost:8086/',
  PROBATION_OFFENDER_SEARCH_ENDPOINT_URL: 'http://localhost:8087/',
  OFFENDER_CATEGORISATION_API_ENDPOINT_URL: 'http://localhost:8088/',
  PATHFINDER_API_ENDPOINT_URL: 'http://localhost:8090/',
  ALERTS_ENDPOINT_URL: 'http://localhost:8089/',
  ADJUDICATIONS_ENDPOINT_URL: 'http://localhost:8091/',
  COMPONENT_API_URL: 'http://localhost:8085/components',
  COMPONENT_API_TIMEOUT_RESPONSE: 20000,
  COMPONENT_API_TIMEOUT_DEADLINE: 20000,

  // Frontend
  INGRESS_URL: 'http://localhost:3000',
  DPS_URL: 'http://localhost:3000/',
  SUPPORT_URL: 'http://localhost:3000/',
  GOOGLE_TAG_MANAGER_TAG: ' ',

  // Business logic
  APPROVED_DISPLAY_MONTHS: '6',
  RECAT_MARGIN_MONTHS: '2',

  // Feature flags
  FEATURE_FLAG__EVENT__DELETE_PENDING_RECATS: 'false',

  // App insights
  APPLICATIONINSIGHTS_CONNECTION_STRING: '',
  PRODUCT_ID: 'UNASSIGNED',
} as const

function get<T extends FallbackValue>({ name, fallback, log, requireInProduction }: GetParams<T>): T | string {
  const value = process.env[name]

  if (value !== undefined) {
    if (log) {
      console.log(`Env var: ${name} value: ${value}`)
    }

    return value
  }

  if (fallback !== undefined && (!production || !requireInProduction)) {
    if (log) {
      console.log(`Env var: ${name} value: ${fallback} (from fallback)`)
    }

    return fallback
  }

  throw new Error(`Missing env var ${name}`)
}

const authUrl = get({
  name: 'NOMIS_AUTH_URL',
  fallback: DEFAULTS.NOMIS_AUTH_URL,
  log: true,
  requireInProduction: false,
})

export const config = {
  // General environment
  environment: process.env.ENVIRONMENT || DEFAULTS.ENVIRONMENT,
  https: production,
  productId: get({
    name: 'PRODUCT_ID',
    fallback: DEFAULTS.PRODUCT_ID,
    log: true,
    requireInProduction: true,
  }),
  // Redis config
  redis: {
    auth_token: process.env.REDIS_AUTH_TOKEN || '',
    tls_enabled: get({
      name: 'REDIS_TLS_ENABLED',
      fallback: DEFAULTS.REDIS_TLS_ENABLED,
      log: true,
      requireInProduction: false,
    }),
    port: get({
      name: 'REDIS_PORT',
      fallback: DEFAULTS.REDIS_PORT,
      log: true,
      requireInProduction: false,
    }),
    host: get({
      name: 'REDIS_HOST',
      fallback: DEFAULTS.REDIS_HOST,
      log: true,
      requireInProduction: false,
    }),
  },
  // Session
  session: {
    secret: get({
      name: 'SESSION_SECRET',
      fallback: DEFAULTS.SESSION_SECRET,
      log: false,
      requireInProduction: true,
    }),
    ttl: get({
      name: 'SESSION_TTL',
      fallback: DEFAULTS.SESSION_TTL,
      log: true,
      requireInProduction: false,
    }),
  },
  // General timeouts
  expiryMinutes: get({
    name: 'WEB_SESSION_TIMEOUT_IN_MINUTES',
    fallback: DEFAULTS.WEB_SESSION_TIMEOUT_IN_MINUTES,
    log: true,
    requireInProduction: false,
  }),
  staticResourceCacheDuration: get({
    name: 'STATIC_RESOURCE_TIMEOUT_IN_MINUTES',
    fallback: DEFAULTS.STATIC_RESOURCE_TIMEOUT_IN_MINUTES,
    log: true,
    requireInProduction: false,
  }),
  // Database
  db: {
    username: get({
      name: 'DB_USER',
      fallback: DEFAULTS.DB_USER,
      log: true,
      requireInProduction: false,
    }),
    password: get({
      name: 'DB_PASS',
      fallback: DEFAULTS.DB_PASS,
      log: false,
      requireInProduction: false,
    }),
    server: get({
      name: 'DB_SERVER',
      fallback: DEFAULTS.DB_SERVER,
      log: true,
      requireInProduction: false,
    }),
    database: get({
      name: 'DB_NAME',
      fallback: DEFAULTS.DB_NAME,
      log: true,
      requireInProduction: false,
    }),
    sslEnabled: get({
      name: 'DB_SSL_ENABLED',
      fallback: DEFAULTS.DB_SSL_ENABLED,
      log: true,
      requireInProduction: false,
    }),
  },
  // SQS
  sqs: {
    enabled: get({
      name: 'SQS_ENABLED',
      fallback: DEFAULTS.SQS_ENABLED,
      log: true,
      requireInProduction: false,
    }),
    riskProfiler: {
      queueUrl: get({
        name: 'RP_QUEUE_URL',
        fallback: DEFAULTS.RP_QUEUE_URL,
        log: false,
        requireInProduction: true,
      }),
      accessKeyId: get({
        name: 'RP_QUEUE_ACCESS_KEY_ID',
        fallback: null,
        log: false,
        requireInProduction: false,
      }),
      secretAccessKey: get({
        name: 'RP_QUEUE_SECRET_ACCESS_KEY',
        fallback: null,
        log: false,
        requireInProduction: false,
      }),
      dlq: {
        queueUrl: get({
          name: 'RP_DL_QUEUE_URL',
          fallback: DEFAULTS.RP_DL_QUEUE_URL,
          log: false,
          requireInProduction: true,
        }),
        accessKeyId: get({
          name: 'RP_DL_QUEUE_ACCESS_KEY_ID',
          fallback: null,
          log: false,
          requireInProduction: false,
        }),
        secretAccessKey: get({
          name: 'RP_DL_QUEUE_SECRET_ACCESS_KEY',
          fallback: null,
          log: false,
          requireInProduction: false,
        }),
      },
    },
    event: {
      queueUrl: get({
        name: 'EVENT_QUEUE_URL',
        fallback: DEFAULTS.EVENT_QUEUE_URL,
        log: true,
        requireInProduction: false,
      }),
      accessKeyId: get({
        name: 'EVENT_QUEUE_ACCESS_KEY_ID',
        fallback: null,
        log: false,
        requireInProduction: false,
      }),
      secretAccessKey: get({
        name: 'EVENT_QUEUE_SECRET_ACCESS_KEY',
        fallback: null,
        log: false,
        requireInProduction: false,
      }),
      dlq: {
        queueUrl: get({
          name: 'EVENT_DL_QUEUE_URL',
          fallback: DEFAULTS.EVENT_DL_QUEUE_URL,
          log: false,
          requireInProduction: true,
        }),
        accessKeyId: get({
          name: 'EVENT_DL_QUEUE_ACCESS_KEY_ID',
          fallback: null,
          log: false,
          requireInProduction: false,
        }),
        secretAccessKey: get({
          name: 'EVENT_DL_QUEUE_SECRET_ACCESS_KEY',
          fallback: null,
          log: false,
          requireInProduction: false,
        }),
      },
    },
  },
  // OAuth
  apis: {
    oauth2: {
      url: authUrl,
      externalUrl: get({
        name: 'NOMIS_AUTH_EXTERNAL_URL',
        fallback: authUrl,
        log: true,
        requireInProduction: false,
      }),
      manageAccountUrl: `${authUrl}/account-details`,
      timeout: {
        response: DEFAULT_TIMEOUTS.response,
        deadline: DEFAULT_TIMEOUTS.deadline,
      },
      authCodeClientId: get({
        name: 'AUTH_CODE_CLIENT_ID',
        fallback: DEFAULTS.AUTH_CODE_CLIENT_ID,
        log: true,
        requireInProduction: false,
      }),
      authCodeClientSecret: get({
        name: 'AUTH_CODE_CLIENT_SECRET',
        fallback: DEFAULTS.AUTH_CODE_CLIENT_SECRET,
        log: false,
        requireInProduction: false,
      }),
      agent: DEFAULT_HTTP_AGENT,
      clientCredsClientId: get({
        name: 'CLIENT_CREDS_CLIENT_ID',
        fallback: DEFAULTS.CLIENT_CREDS_CLIENT_ID,
        log: true,
        requireInProduction: false,
      }),
      clientCredsClientSecret: get({
        name: 'CLIENT_CREDS_CLIENT_SECRET',
        fallback: DEFAULTS.CLIENT_CREDS_CLIENT_SECRET,
        log: false,
        requireInProduction: false,
      }),
    },
    elite2: {
      url: get({
        name: 'ELITE2API_ENDPOINT_URL',
        fallback: DEFAULTS.ELITE2API_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'ELITE2API_ENDPOINT_TIMEOUT_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'ELITE2API_ENDPOINT_TIMEOUT_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    riskProfiler: {
      url: get({
        name: 'RISK_PROFILER_ENDPOINT_URL',
        fallback: DEFAULTS.RISK_PROFILER_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'RISK_PROFILER_ENDPOINT_TIMEOUT_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'RISK_PROFILER_ENDPOINT_TIMEOUT_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    allocationManager: {
      url: get({
        name: 'ALLOCATION_MANAGER_ENDPOINT_URL',
        fallback: DEFAULTS.ALLOCATION_MANAGER_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'ALLOCATION_MANAGER_TIMEOUT_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'ALLOCATION_MANAGER_TIMEOUT_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    prisonerSearch: {
      url: get({
        name: 'PRISONER_SEARCH_ENDPOINT_URL',
        fallback: DEFAULTS.PRISONER_SEARCH_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'PRISONER_SEARCH_TIMEOUT_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'PRISONER_SEARCH_TIMEOUT_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    alertsApi: {
      url: get({
        name: 'ALERTS_ENDPOINT_URL',
        fallback: DEFAULTS.ALERTS_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'ALERTS_TIMEOUT_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'ALERTS_TIMEOUT_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    adjudicationsApi: {
      url: get({
        name: 'ADJUDICATIONS_ENDPOINT_URL',
        fallback: DEFAULTS.ADJUDICATIONS_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'ADJUDICATIONS_TIMEOUT_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'ADJUDICATIONS_TIMEOUT_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    pathfinderApi: {
      url: get({
        name: 'PATHFINDER_API_ENDPOINT_URL',
        fallback: DEFAULTS.PATHFINDER_API_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'PATHFINDER_API_ENDPOINT_TIMEOUT_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'PATHFINDER_API_ENDPOINT_TIMEOUT_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    risksAndNeeds: {
      url: get({
        name: 'RISKS_AND_NEEDS_ENDPOINT_URL',
        fallback: DEFAULTS.RISKS_AND_NEEDS_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'RISKS_AND_NEEDS_ENDPOINT_URL_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'RISKS_AND_NEEDS_ENDPOINT_URL_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    probationOffenderSearch: {
      url: get({
        name: 'PROBATION_OFFENDER_SEARCH_ENDPOINT_URL',
        fallback: DEFAULTS.PROBATION_OFFENDER_SEARCH_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'PROBATION_OFFENDER_SEARCH_ENDPOINT_URL_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'PROBATION_OFFENDER_SEARCH_ENDPOINT_URL_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    offenderCategorisationApi: {
      url: get({
        name: 'OFFENDER_CATEGORISATION_API_ENDPOINT_URL',
        fallback: DEFAULTS.OFFENDER_CATEGORISATION_API_ENDPOINT_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'OFFENDER_CATEGORISATION_API_ENDPOINT_URL_RESPONSE',
            fallback: DEFAULT_TIMEOUTS.response,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'OFFENDER_CATEGORISATION_API_ENDPOINT_URL_DEADLINE',
            fallback: DEFAULT_TIMEOUTS.deadline,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
    frontendComponents: {
      url: get({
        name: 'COMPONENT_API_URL',
        fallback: DEFAULTS.COMPONENT_API_URL,
        log: true,
        requireInProduction: false,
      }),
      timeout: {
        response: Number(
          get({
            name: 'COMPONENT_API_TIMEOUT_RESPONSE',
            fallback: DEFAULTS.COMPONENT_API_TIMEOUT_RESPONSE,
            log: true,
            requireInProduction: false,
          }),
        ),
        deadline: Number(
          get({
            name: 'COMPONENT_API_TIMEOUT_DEADLINE',
            fallback: DEFAULTS.COMPONENT_API_TIMEOUT_DEADLINE,
            log: true,
            requireInProduction: false,
          }),
        ),
      },
      agent: DEFAULT_HTTP_AGENT,
    },
  },
  // Frontend
  domain: get({
    name: 'INGRESS_URL',
    fallback: DEFAULTS.INGRESS_URL,
    log: true,
    requireInProduction: false,
  }),
  dpsUrl: get({
    name: 'DPS_URL',
    fallback: DEFAULTS.DPS_URL,
    log: true,
    requireInProduction: false,
  }),
  supportUrl: get({
    name: 'SUPPORT_URL',
    fallback: DEFAULTS.SUPPORT_URL,
    log: true,
    requireInProduction: false,
  }),
  googleTagManagerTag: get({
    name: 'GOOGLE_TAG_MANAGER_TAG',
    fallback: DEFAULTS.GOOGLE_TAG_MANAGER_TAG,
    log: true,
    requireInProduction: false,
  }),
  approvedDisplayMonths: get({
    name: 'APPROVED_DISPLAY_MONTHS',
    fallback: DEFAULTS.APPROVED_DISPLAY_MONTHS,
    log: true,
    requireInProduction: false,
  }),
  recatMarginMonths: get({
    name: 'RECAT_MARGIN_MONTHS',
    fallback: DEFAULTS.RECAT_MARGIN_MONTHS,
    log: true,
    requireInProduction: false,
  }),
  femalePrisonIds: get({
    name: 'FEMALE_PRISON_IDS',
    fallback: DEFAULT_FEMALE_PRISON_IDS_ENV,
    log: true,
    requireInProduction: false,
  }),
  // Feature flags
  featureFlags: {
    events: {
      offender_release: {
        enable_pending_categorisation_deletion: get({
          name: 'FEATURE_FLAG__EVENT__DELETE_PENDING_RECATS',
          fallback: DEFAULTS.FEATURE_FLAG__EVENT__DELETE_PENDING_RECATS,
          log: true,
          requireInProduction: false,
        }),
      },
    },
  },
  // App insights
  appInsightsConnectionString: get({
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING',
    fallback: DEFAULTS.APPLICATIONINSIGHTS_CONNECTION_STRING,
    log: true,
    requireInProduction: true,
  }),
}
