import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import { config } from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import logger from '../../../log'
import { getSanitisedError } from '../../getSanitisedError'
import { User } from '../user'
import { AdjudicationsDto } from './adjudications.dto'

export type AdjudicationsApiClientBuilder = (user: User) => AdjudicationsApiClient

export interface AdjudicationsApiClient {
  getAdjudications: (bookingId: number, cutoffDate: string) => Promise<AdjudicationsDto>
}

const timeoutSpec = {
  response: config.apis.alertsApi.timeout.response,
  deadline: config.apis.alertsApi.timeout.deadline,
}

const agentOptions = {
  maxSockers: config.apis.alertsApi.agent.maxSockets,
  maxFreeSockets: config.apis.alertsApi.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.alertsApi.agent.freeSocketTimeout,
}

const apiUrl = config.apis.adjudicationsApi.url

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

export const adjudicationsApiClientBuilder: AdjudicationsApiClientBuilder = (user: User) => {
  const apiGet = adjudicationsApiGetBuilder(user.username)

  return {
    async getAdjudications(bookingId: number, cutoffDate: string): Promise<AdjudicationsDto> {
      const path = `${apiUrl}adjudications/by-booking-id/${bookingId}`
      const query = `adjudicationCutoffDate=${cutoffDate}`
      return apiGet({ path, query })
    },
  }
}

function adjudicationsApiGetBuilder(username: string) {
  return async ({ path = '', query = '', headers = {}, responseType = '' } = {}) => {
    try {
      const clientToken = await getApiClientToken(username)

      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .agent(keepaliveAgent)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return result.body
    } catch (error) {
      if (error.response?.status === 404) {
        return {}
      }
      const sanitisedError = getSanitisedError(error)
      logger.error({ sanitisedError, path, query }, 'Error calling alerts api')
      throw sanitisedError
    }
  }
}
