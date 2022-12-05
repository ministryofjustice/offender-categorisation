const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const logger = require('../../log')
const config = require('../config')
const { getApiClientToken } = require('../authentication/clientCredentials')
const getSanitisedError = require('../sanitisedError')

const timeoutSpec = {
  response: config.apis.prisonerSearch.timeout.response,
  deadline: config.apis.prisonerSearch.timeout.deadline,
}
const agentOptions = {
  maxSockets: config.apis.prisonerSearch.agent.maxSockets,
  maxFreeSockets: config.apis.prisonerSearch.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.prisonerSearch.agent.freeSocketTimeout,
}

const apiUrl = config.apis.prisonerSearch.url
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

module.exports = context => {
  const apiGet = prisonerSearchGetBuilder(context.user.username)
  const apiPost = prisonerSearchPostBuilder(context.user.username)

  return {
    async getPrisonersAtLocation(agencyId, fromDob, toDob) {
      const path = `${apiUrl}prison/${agencyId}/prisoners`
      const query = `fromDob=${fromDob}&toDob=${toDob}`
      return apiGet({ path, query })
    },

    async getSentenceDatesForOffenders(bookingIds) {
      if (bookingIds.length === 0) return []
      const path = `${apiUrl}prisoner-search/booking-ids`
      return apiPost({ path, body: { bookingIds } })
    },
  }
}

function prisonerSearchGetBuilder(username) {
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
      const sanitisedError = getSanitisedError(error)
      logger.error({ sanitisedError, path, query }, 'Error calling prisonerSearch api')
      throw sanitisedError
    }
  }
}

function prisonerSearchPostBuilder(username) {
  return async ({ path, body = {}, headers = {}, responseType = '' } = {}) => {
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
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path }, 'Error in Nomis POST')
      throw sanitisedError
    }
  }
}
