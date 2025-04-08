const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')

const logger = require('../../log').default
const config = require('../config')
const getSanitisedError = require('../sanitisedError')

const timeoutSpec = {
  response: config.apis.frontendComponents.timeout.response,
  deadline: config.apis.frontendComponents.timeout.deadline,
}

const agentOptions = {
  maxSockets: config.apis.frontendComponents.agent.maxSockets,
  maxFreeSockets: config.apis.frontendComponents.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.frontendComponents.agent.freeSocketTimeout,
}

const apiUrl = config.apis.frontendComponents.url
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

module.exports = token => {
  const get = dpsFeClientGetBuilder(token)
  return {
    getComponent(component) {
      const path = `${apiUrl}/${component}`
      return get({ path })
    },
  }
}

function dpsFeClientGetBuilder(token) {
  // eslint-disable-next-line consistent-return
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    try {
      const result = await superagent
        .get(path)
        .agent(keepaliveAgent)
        .query(query)
        .set('x-user-token', token ?? '')
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return raw ? result : result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      // a 401 is a valid outcome here if logged out and trying to request the header / footer
      if (sanitisedError.status !== 401) {
        logger.warn(
          { ...sanitisedError, path, query },
          'Error in DPS Front End Components GET using clientId credentials',
        )
        throw sanitisedError
      }
    }
  }
}
