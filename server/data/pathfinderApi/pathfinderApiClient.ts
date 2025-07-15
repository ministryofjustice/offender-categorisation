import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import { config } from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import logger from '../../../log'
import { getSanitisedError } from '../../getSanitisedError'
import { User } from '../user'
import { PathfinderDataDto } from './escapeProfile.dto'

const timeoutSpec = {
  response: config.apis.pathfinderApi.timeout.response,
  deadline: config.apis.pathfinderApi.timeout.deadline,
}

const agentOptions = {
  maxSockets: config.apis.pathfinderApi.agent.maxSockets,
  maxFreeSockets: config.apis.pathfinderApi.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.pathfinderApi.agent.freeSocketTimeout,
}

const apiUrl = config.apis.pathfinderApi.url

const keepAliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

export const pathfinderApiClientBuilder = (user: User) => {
  const apiGet = pathfinderApiGetBuilder(user.username)

  return {
    async getPathfinderData(offenderNo: string): Promise<PathfinderDataDto> {
      const path = `${apiUrl}pathfinder/nominal/noms-id/${offenderNo}`
      return apiGet({ path })
    },
  }

  function pathfinderApiGetBuilder(username: string) {
    return async ({ path = '', query = '', headers = {}, responseType = '' } = {}) => {
      try {
        const clientToken = await getApiClientToken(username)

        const result = await superagent
          .get(path)
          .query(query)
          .set('Authorization', `Bearer ${clientToken.body.access_token}`)
          .set(headers)
          .agent(keepAliveAgent)
          .responseType(responseType)
          .timeout(timeoutSpec)

        return result.body
      } catch (error) {
        const sanitisedError = getSanitisedError(error)
        if (error.status !== 404) {
          logger.error({ sanitisedError, path, query }, 'Error calling pathfinder api')
        }
        throw sanitisedError
      }
    }
  }
}
