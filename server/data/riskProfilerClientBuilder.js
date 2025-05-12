const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const logger = require('../../log')
const { config } = require('../config')
const { getApiClientToken } = require('../authentication/clientCredentials')
const { getSanitisedError } = require('../getSanitisedError')

const timeoutSpec = {
  response: config.apis.riskProfiler.timeout.response,
  deadline: config.apis.riskProfiler.timeout.deadline,
}
const agentOptions = {
  maxSockets: config.apis.riskProfiler.agent.maxSockets,
  maxFreeSockets: config.apis.riskProfiler.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.riskProfiler.agent.freeSocketTimeout,
}

const apiUrl = `${config.apis.riskProfiler.url}risk-profile/`
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

module.exports = context => {
  const apiGet = riskProfilerGetBuilder(context.user.username)

  return {
    getSocProfile(offenderNo) {
      const path = `${apiUrl}soc/${offenderNo}`
      logger.debug(`getSocProfile calling riskProfiler api : ${path} for offenderNo ${offenderNo}`)
      return apiGet({ path })
    },
    getViolenceProfile(offenderNo) {
      const path = `${apiUrl}violence/${offenderNo}`
      logger.debug(`getViolenceProfile calling riskProfiler api : ${path} for offenderNo ${offenderNo}`)
      return apiGet({ path })
    },
    getEscapeProfile(offenderNo) {
      const path = `${apiUrl}escape/${offenderNo}`
      logger.debug(`getEscapeProfile calling riskProfiler api : ${path} for offenderNo ${offenderNo}`)
      return apiGet({ path })
    },
    getExtremismProfile(offenderNo, previousOffences) {
      const path = `${apiUrl}extremism/${offenderNo}?previousOffences=${previousOffences}`
      logger.debug(
        `getExtremismProfile calling riskProfiler api : ${path} for offenderNo ${offenderNo} and previousOffences ${previousOffences}`,
      )
      return apiGet({ path })
    },
    getLifeProfile(offenderNo) {
      const path = `${apiUrl}life/${offenderNo}`
      logger.debug(`getLifeProfile calling riskProfiler api : ${path} for offenderNo ${offenderNo}`)
      return apiGet({ path })
    },
  }
}

function riskProfilerGetBuilder(username) {
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
      logger.error({ sanitisedError, path, query }, 'Error calling riskProfiler api')
      throw sanitisedError
    }
  }
}
