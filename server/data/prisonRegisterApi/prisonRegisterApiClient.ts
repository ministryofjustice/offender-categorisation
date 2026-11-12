import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent from 'superagent'
import { User } from '../user'
import { config } from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import { getSanitisedError } from '../../getSanitisedError'
import logger from '../../../log'
import { PrisonsDto } from './prison.dto'

export type PrisonRegisterApiClientBuilder = (user: User) => PrisonRegisterApiClient

export interface PrisonRegisterApiClient {
  getPrisons: () => Promise<PrisonsDto[]>
  getPrison: (prisonId: string) => Promise<PrisonsDto>
}

const timeoutSpec = {
  response: config.apis.prisonRegisterApi.timeout.response,
  deadline: config.apis.prisonRegisterApi.timeout.deadline,
}

const agentOptions = {
  maxSockets: config.apis.prisonRegisterApi.agent.maxSockets,
  maxFreeSockets: config.apis.prisonRegisterApi.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.prisonRegisterApi.agent.freeSocketTimeout,
}

const apiUrl = config.apis.prisonRegisterApi.url

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

export const prisonRegisterApiClientBuilder: PrisonRegisterApiClientBuilder = (user: User) => {
  const apiGet = prisonRegisterApiGetBuilder(user.username)

  return {
    async getPrisons(): Promise<PrisonsDto[]> {
      const path = `${apiUrl}prisons`
      return apiGet({ path })
    },
    async getPrison(prisonId: string): Promise<PrisonsDto> {
      const path = `${apiUrl}prisons/id/${prisonId}`
      return apiGet({ path })
    },
  }
}

function prisonRegisterApiGetBuilder(username: string) {
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
      logger.error({ sanitisedError, path, query }, 'Error calling prison register api')
      throw sanitisedError
    }
  }
}
