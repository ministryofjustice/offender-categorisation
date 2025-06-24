import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import { config } from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import logger from '../../../log'
import { getSanitisedError } from '../../getSanitisedError'
import {
  ESCAPE_LIST_ALERT_CODE,
  ESCAPE_RISK_ALERT_CODE,
  ESCAPE_LIST_HEIGHTENED_ALERT_CODE,
} from '../prisonerSearch/alert/prisonerSearchAlert.dto'
import { EscapeAlertDto } from './escapeAlert.dto'
import { User } from '../user'

const timeoutSpec = {
  response: config.apis.alertsApi.timeout.response,
  deadline: config.apis.alertsApi.timeout.deadline,
}

const agentOptions = {
  maxSockers: config.apis.alertsApi.agent.maxSockets,
  maxFreeSockets: config.apis.alertsApi.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.alertsApi.agent.freeSocketTimeout,
}

const apiUrl = config.apis.alertsApi.url

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

export const alertsApiClientBuilder = (user: User) => {
  const apiGet = alertsApiGetBuilder(user.username)

  return {
    async getActivePrisonerEscapeAlerts(offenderNo: string): Promise<EscapeAlertDto[]> {
      const path = `${apiUrl}prisoners/${offenderNo}/alerts`
      const query = `isActive=true&alertCode=${ESCAPE_RISK_ALERT_CODE},${ESCAPE_LIST_ALERT_CODE},${ESCAPE_LIST_HEIGHTENED_ALERT_CODE}`
      const response = await apiGet({ path, query })

      return response
    },
  }
}

function alertsApiGetBuilder(username: string) {
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
      const sanitisedError = getSanitisedError(error)
      logger.error({ sanitisedError, path, query }, 'Error calling alerts api')
      throw sanitisedError
    }
  }
}
