import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent from 'superagent'
import { config } from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import getSanitisedError from '../../sanitisedError'
import logger from '../../../log'
import { ProbationOffenderSearchOffenderDto } from './probationOffenderSearchOffender.dto'
import { User } from '../user'

export type ProbationOffenderSearchApiClientBuilder = (user: User) => ProbationOffenderSearchApiClient

export interface ProbationOffenderSearchApiClient {
  matchPrisoners: (prisonerNumbers: string[]) => Promise<ProbationOffenderSearchOffenderDto[]>
}

const timeoutSpec = {
  response: config.apis.probationOffenderSearch.timeout.response,
  deadline: config.apis.probationOffenderSearch.timeout.deadline,
}
const agentOptions = {
  maxSockets: config.apis.probationOffenderSearch.agent.maxSockets,
  maxFreeSockets: config.apis.probationOffenderSearch.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.probationOffenderSearch.agent.freeSocketTimeout,
}

const apiUrl = `${config.apis.probationOffenderSearch.url}`
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

const builder: ProbationOffenderSearchApiClientBuilder = user => {
  const apiPost = probationOffenderSearchPostBuilder(user.username)

  return {
    async matchPrisoners(prisonerNumbers: string[]): Promise<ProbationOffenderSearchOffenderDto[]> {
      const path = `${apiUrl}nomsNumbers`
      return apiPost({ path, body: prisonerNumbers })
    },
  }
}

export default builder

function probationOffenderSearchPostBuilder(username: string) {
  return async ({ path, body = {}, headers = {}, responseType = '' }) => {
    try {
      const clientToken = await getApiClientToken(username)

      const result = await superagent
        .post(path)
        .agent(keepaliveAgent)
        .send(body)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)
      return result.body
    } catch (error) {
      if (error?.status === 404) {
        return undefined
      }
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path }, 'Error in Nomis POST')
      throw sanitisedError
    }
  }
}
