const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const LRU = require('lru-cache')
const logger = require('../../log')
const { config } = require('../config')
const { getApiClientToken } = require('../authentication/clientCredentials')
const { getSanitisedError } = require('../getSanitisedError')

// there are about 80000 prisoner altogether but they wont all be due for categorisation
// 4 hour TTL is fine for slowly changing POM data but should give good hit ratio
const cache = new LRU({ max: 30000, maxAge: 1000 * 60 * 60 * 4 })

const timeoutSpec = {
  response: config.apis.allocationManager.timeout.response,
  deadline: config.apis.allocationManager.timeout.deadline,
}
const agentOptions = {
  maxSockets: config.apis.allocationManager.agent.maxSockets,
  maxFreeSockets: config.apis.allocationManager.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.allocationManager.agent.freeSocketTimeout,
}

const apiUrl = `${config.apis.allocationManager.url}api/`
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

module.exports = context => {
  const apiGet = allocationManagerGetBuilder(context.user.username)

  return {
    async getPomByOffenderNo(offenderNo) {
      const cached = cache.get(offenderNo)
      if (cached) {
        return cached
      }

      const path = `${apiUrl}allocation/${offenderNo}`
      const value = await apiGet({ path })

      cache.set(offenderNo, value)
      return value
    },
  }
}

function allocationManagerGetBuilder(username) {
  return async ({ path, query = '', headers = {}, responseType = '' } = {}) => {
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
      const sanitisedError = getSanitisedError(error)
      logger.error({ sanitisedError, path, query }, 'Error calling allocationManager api')
      if (error.response?.status === 500) {
        // Possible bug is causing occasional 500 errors in preprod
        return {}
      }
      throw sanitisedError
    }
  }
}
