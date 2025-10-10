import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import moment from 'moment'
import { getApiClientToken } from '../../authentication/clientCredentials'
import { config } from '../../config'
import logger from '../../../log'
import { getSanitisedError } from '../../getSanitisedError'
import { ViperDto } from './viper.dto'

export type FormApiClient = {
  submitSecurityReview(bookingId: number, submitted: boolean, securityReview: string | undefined): Promise<boolean>
  getViperData(prisonerNumber: string): Promise<ViperDto>
}

const timeoutSpec = {
  response: config.apis.offenderCategorisationApi.timeout.response,
  deadline: config.apis.offenderCategorisationApi.timeout.deadline,
}

const agentOptions = {
  maxSockets: config.apis.offenderCategorisationApi.agent.maxSockets,
  maxFreeSockets: config.apis.offenderCategorisationApi.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.offenderCategorisationApi.agent.freeSocketTimeout,
}

const apiUrl = config.apis.offenderCategorisationApi.url
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

export const formApiClientBuilder = (username: string): FormApiClient => {
  const clientPost = clientPostBuilder(username)
  const clientGet = clientGetBuilder(username)

  return {
    submitSecurityReview: async (
      bookingId: number,
      submitted: boolean,
      securityReview: string | undefined = undefined,
    ) => {
      const path = `${apiUrl}security/review/${bookingId}`
      return clientPost({
        path,
        data: {
          userId: username,
          submitted,
          securityReview,
        },
      })
    },
    getViperData: async (prisonerNumber: string): Promise<ViperDto> => {
      const path = `${apiUrl}risk/viper/${prisonerNumber}`
      return clientGet({ path })
    },
  }
}

function clientPostBuilder(username: string) {
  return async ({ path = '', headers = {}, responseType = '', data = {} } = {}) => {
    const time = moment()
    try {
      const clientToken = await getApiClientToken(username)
      const result = await superagent
        .post(path)
        .agent(keepaliveAgent)
        .retry(2, err => {
          if (err) logger.warn(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .send(data)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      const durationMillis = moment().diff(time)
      logger.debug({ path, data, durationMillis }, 'Client POST')

      return result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path }, 'Error in Client POST')
      throw sanitisedError
    }
  }
}

function clientGetBuilder(username: string) {
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
      logger.error({ sanitisedError, path, query }, 'Error in client GET')
      throw sanitisedError
    }
  }
}
