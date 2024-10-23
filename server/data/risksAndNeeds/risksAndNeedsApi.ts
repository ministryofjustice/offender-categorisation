import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent from 'superagent'
import redis from 'redis'
import config from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import getSanitisedError from '../../sanitisedError'
import logger from '../../../log'
import { User } from '../user'
import { RiskSummaryDto } from './riskSummary.dto'

const REDIS_KEY_PREFIX = 'riskSummary'
const REDIS_EXPIRY = 1000 * 60 * 60 * 24

export type RisksAndNeedsApiClientBuilder = (user: User) => RisksAndNeedsApiClient

export interface RisksAndNeedsApiClient {
  getRisksSummary: (crn) => Promise<RiskSummaryDto>
}

const redisClient = redis.createClient({
  legacyMode: true, // connect-redis only supports legacy mode for redis v4
  socket: {
    port: config.redis.port,
    host: config.redis.host,
    tls: config.redis.tls_enabled === 'true',
  },
  password: config.redis.auth_token,
})

redisClient
  .connect()
  .then(() => logger.info('hmppsAuthService Redis connected'))
  .catch((error: Error) => {
    logger.error({ err: error }, 'hmppsAuthService Redis connect error')
  })
redisClient.on('error', error => {
  logger.error({ err: error }, 'hmppsAuthService Redis error')
})

const timeoutSpec = {
  response: config.apis.risksAndNeeds.timeout.response,
  deadline: config.apis.risksAndNeeds.timeout.deadline,
}
const agentOptions = {
  maxSockets: config.apis.risksAndNeeds.agent.maxSockets,
  maxFreeSockets: config.apis.risksAndNeeds.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.risksAndNeeds.agent.freeSocketTimeout,
}

const apiUrl = config.apis.risksAndNeeds.url
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

const builder: RisksAndNeedsApiClientBuilder = user => {
  const apiGet = risksAndNeedsApiGetBuilder(user.username)

  return {
    async getRisksSummary(crn): Promise<RiskSummaryDto> {
      const redisKey = `${REDIS_KEY_PREFIX}_${crn}`
      const cached = await redisClient.v4.get(redisKey)
      if (cached) {
        return cached
      }

      const path = `${apiUrl}risks/crn/${crn}/summary`
      const value = await apiGet({ path })

      await redisClient.v4.set(redisKey, value, { EX: REDIS_EXPIRY })
      return value
    },
  }
}

export default builder

function risksAndNeedsApiGetBuilder(username) {
  return async ({ path, query = '', headers = {}, responseType = '' }) => {
    try {
      const oauthResult = await getApiClientToken(username)
      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${oauthResult.body.access_token}`)
        .set(headers)
        .agent(keepaliveAgent)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return result.body
    } catch (error) {
      if (error.response?.status === 404) {
        return {}
      }
      // 403 errors are returned for crns of restricted access people, we will record how many these occur for but continue as if they do not have a rosh score
      if (error.response?.status === 403) {
        logger.info('Risks and needs API: restricted crn requested')
        return {}
      }
      const sanitisedError = getSanitisedError(error)
      logger.error({ sanitisedError, path, query }, 'Error calling risks and needs api')
      throw sanitisedError
    }
  }
}
