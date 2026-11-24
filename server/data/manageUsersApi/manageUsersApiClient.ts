import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import { config } from '../../config'
import logger from '../../../log'
import { getSanitisedError } from '../../getSanitisedError'
import { UserDto } from './user.dto'
import { UserCaseloadDto } from './userCaseload.dto'

export type ManageUsersApiClientBuilder = (token: string) => ManageUsersApiClient

export interface ManageUsersApiClient {
  getUser: () => Promise<UserDto>
  getUserByUsername: (username: string) => Promise<UserDto>
  getUserCaseload: () => Promise<UserCaseloadDto>
  getUsersByUsername: (usernames: string[]) => Promise<UserDto[]>
}

const timeoutSpec = {
  response: config.apis.manageUsersApi.timeout.response,
  deadline: config.apis.manageUsersApi.timeout.deadline,
}

const agentOptions = {
  maxSockets: config.apis.manageUsersApi.agent.maxSockets,
  maxFreeSockets: config.apis.manageUsersApi.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.manageUsersApi.agent.freeSocketTimeout,
}

const apiUrl = config.apis.manageUsersApi.url

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

export const manageUsersApiClientBuilder: ManageUsersApiClientBuilder = (token: string) => {
  const apiGet = manageUsersApiGetBuilder(token)
  const apiPost = manageUsersApiPostBuilder(token)

  return {
    async getUser(): Promise<UserDto> {
      const path = `${apiUrl}users/me`
      return apiGet({ path })
    },
    async getUserByUsername(username: string): Promise<UserDto> {
      const path = `${apiUrl}users/${username}`
      return apiGet({ path })
    },
    async getUserCaseload(): Promise<UserCaseloadDto> {
      const path = `${apiUrl}users/me/caseloads`
      return apiGet({ path })
    },
    async getUsersByUsername(usernames: string[]): Promise<UserDto[]> {
      // Manage Users returns a 500 if the list contains null/empty entries
      const validUsernames = usernames.filter(Boolean)
      if (!validUsernames.length) {
        return []
      }
      const path = `${apiUrl}prisonusers/find-by-usernames`
      return apiPost({ path, body: validUsernames })
    },
  }
}

function manageUsersApiGetBuilder(token: string) {
  return async ({ path = '', query = '', headers = {}, responseType = '', raw = false } = {}) => {
    logger.info(`Get using user credentials: calling oauth: ${path} ${query}`)
    try {
      const result = await superagent
        .get(path)
        .agent(keepaliveAgent)
        .retry(2, err => {
          if (err) logger.warn(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined
        })
        .query(query)
        .auth(token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return raw ? result : result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.warn({ path, ...sanitisedError, query }, 'Error calling oauth')
      throw sanitisedError
    }
  }
}

function manageUsersApiPostBuilder(token: string) {
  return async ({ path, body = {}, headers = {}, responseType = '' }) => {
    try {
      const result = await superagent
        .post(path)
        .agent(keepaliveAgent)
        .send(body)
        .auth(token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)
      return result.body
    } catch (error) {
      if (error?.status === 404) {
        return undefined
      }
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path }, 'Error calling oauth')
      throw sanitisedError
    }
  }
}
