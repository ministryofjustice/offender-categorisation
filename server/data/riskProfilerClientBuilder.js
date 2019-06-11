/* eslint-disable no-unused-vars */
const logger = require('../../log')
const config = require('../config')
const superagent = require('superagent')
const { getApiClientToken } = require('../authentication/clientCredentials')
const { getNamespace } = require('cls-hooked')

const timeoutSpec = {
  response: config.apis.riskProfiler.timeout.response,
  deadline: config.apis.riskProfiler.timeout.deadline,
}

const apiUrl = `${config.apis.riskProfiler.url}risk-profile/`

module.exports = username => {
  const apiGet = riskProfilerGetBuilder(username)
  const apiPost = riskProfilerPushBuilder('post', username)
  const apiPut = riskProfilerPushBuilder('put', username)

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
        `getExtremismProfile calling riskProfiler api : ${path} for offenderNo ${offenderNo} and previousOffences ${previousOffences}`
      )
      return apiGet({ path })
    },
  }
}

function riskProfilerGetBuilder(username) {
  return async ({ path, query = '', headers = {}, responseType = '' } = {}) => {
    try {
      const oauthResult = await getApiClientToken(username)
      const ns = getNamespace('request.scope')
      const correlationId = ns.get('correlationId')

      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${oauthResult.body.access_token}`)
        .set('correlationId', correlationId)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return result.body
    } catch (error) {
      logger.warn(error, 'Error calling riskProfiler api')

      throw error
    }
  }
}

function riskProfilerPushBuilder(verb, username) {
  const updateMethod = {
    put,
    post,
  }

  return async ({ path, body = '', headers = {}, responseType = '' } = {}) => {
    try {
      const oauthResult = await getApiClientToken(username)
      const result = await updateMethod[verb](oauthResult.body.access_token, path, body, headers, responseType)
      return result.body
    } catch (error) {
      logger.warn('Error calling riskProfiler api')
      logger.warn(error)

      throw error
    }
  }
}

async function post(token, path, body, headers, responseType) {
  const ns = getNamespace('request.scope')
  const correlationId = ns.get('correlationId')

  return superagent
    .post(path)
    .send(body)
    .set('Authorization', `Bearer ${token}`)
    .set('correlationId', correlationId)
    .set(headers)
    .responseType(responseType)
    .timeout(timeoutSpec)
}

async function put(token, path, body, headers, responseType) {
  const ns = getNamespace('request.scope')
  const correlationId = ns.get('correlationId')

  return superagent
    .put(path)
    .send(body)
    .set('Authorization', `Bearer ${token}`)
    .set('correlationId', correlationId)
    .set(headers)
    .responseType(responseType)
    .timeout(timeoutSpec)
}
