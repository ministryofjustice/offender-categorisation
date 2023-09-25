const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')

const moment = require('moment')
const logger = require('../../log')
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
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    const time = moment()
    try {
      const result = await superagent
        .get(path)
        .agent(keepaliveAgent)
        .query(query)
        .set('x-user-token', token)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      const durationMillis = moment().diff(time)
      logger.debug({ path, query, durationMillis }, 'DPS Front End Components GET using clientId credentials')
      return raw ? result : result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error(
        { ...sanitisedError, path, query },
        'Error in DPS Front End Components GET using clientId credentials'
      )
      throw sanitisedError
    }
  }
}
