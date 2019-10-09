/* eslint-disable no-unused-vars */
const superagent = require('superagent')
const logger = require('../../log')
const config = require('../config')
const { getApiClientToken } = require('../authentication/clientCredentials')

const timeoutSpec = {
  response: config.apis.riskProfiler.timeout.response,
  deadline: config.apis.riskProfiler.timeout.deadline,
}

const apiUrl = `${config.apis.riskProfiler.url}risk-profile/`

module.exports = context => {
  const apiGet = riskProfilerGetBuilder(context.user.username)
  const apiPost = riskProfilerPushBuilder('post', context.user.username)
  const apiPut = riskProfilerPushBuilder('put', context.user.username)

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
      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${oauthResult.body.access_token}`)
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
  return superagent
    .post(path)
    .send(body)
    .set('Authorization', `Bearer ${token}`)
    .set(headers)
    .responseType(responseType)
    .timeout(timeoutSpec)
}

async function put(token, path, body, headers, responseType) {
  return superagent
    .put(path)
    .send(body)
    .set('Authorization', `Bearer ${token}`)
    .set(headers)
    .responseType(responseType)
    .timeout(timeoutSpec)
}
