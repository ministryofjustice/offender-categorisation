const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const logger = require('../../log')
const { config } = require('../config')
const { getApiClientToken } = require('../authentication/clientCredentials')
const { getSanitisedError } = require('../getSanitisedError')

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
      // use size to effectively turn off paging
      const query = `size=1000000&fromDob=${fromDob}&toDob=${toDob}`
      const response = await apiGet({ path, query })
      return response.content.map(r => ({
        ...r,
        bookingId: Number(r.bookingId),
      }))
    },

    async getPrisonersByBookingIds(bookingIds) {
      if (bookingIds.length === 0) return []
      const path = `${apiUrl}prisoner-search/booking-ids`
      // Unfortunately prisoner search currently restricts requests to a maximum of 1000 records
      const BATCH_SIZE = 1000
      const responses = []
      for (let range = 0; range < bookingIds.length; range += BATCH_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        const response = await apiPost({
          path,
          body: { bookingIds: bookingIds.slice(range, range + BATCH_SIZE) },
        })
        response.forEach(r =>
          responses.push({
            bookingId: Number(r.bookingId),
            prisonerNumber: r.prisonerNumber,
            releaseDate: r.releaseDate,
            sentenceStartDate: r.sentenceStartDate,
            status: r.status,
            alerts: r.alerts,
            currentIncentive: r.currentIncentive,
            legalStatus: r.legalStatus,
            recall: r.recall,
            offenderNo: r.prisonerNumber,
          }),
        )
      }
      return responses
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
