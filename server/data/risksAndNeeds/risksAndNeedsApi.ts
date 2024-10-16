import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent from 'superagent'
import LRU from 'lru-cache'
import config from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import getSanitisedError from '../../sanitisedError'
import logger from '../../../log'
import { User } from '../user'
import { RiskSummaryDto } from './riskSummary.dto'

export type RisksAndNeedsApiClientBuilder = (user: User) => RisksAndNeedsApiClient

export interface RisksAndNeedsApiClient {
  getRisksSummary: (crn) => Promise<RiskSummaryDto>
}

// there are about 80000 prisoner altogether but they wont all be due for categorisation
// 4 hour TTL is fine for slowly changing POM data but should give good hit ratio
const cache = new LRU({ max: 30000, maxAge: 1000 * 60 * 60 * 4 })

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
      const cached = cache.get(crn)
      if (cached) {
        return cached
      }

      const path = `${apiUrl}risks/crn/${crn}/summary`
      const value = await apiGet({ path })

      cache.set(crn, value)
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
