/* eslint-disable no-unused-vars */
const logger = require('../../log')
const config = require('../config')
const superagent = require('superagent')
const querystring = require('querystring')
const { generateOauthClientToken } = require('../authentication/clientCredentials')

const timeoutSpec = {
  response: config.apis.riskProfiler.timeout.response,
  deadline: config.apis.riskProfiler.timeout.deadline,
}

const apiUrl = config.apis.riskProfiler.url
const oauthUrl = `${config.apis.oauth2.url}/oauth/token`

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
    getEscapeProfile(offenderNo) {
      const path = `${apiUrl}escape/${offenderNo}`
      logger.debug(`getEscapeProfile calling riskProfiler api : ${path} for offenderNo ${offenderNo}`)
      return apiGet({ path })
    },
  }
}

function riskProfilerGetBuilder(username) {
  return async ({ path, query = '', headers = {}, responseType = '' } = {}) => {
    try {
      const oauthResult = await getRiskProfilerApiClientToken(username)

      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${oauthResult.body.access_token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return result.body
    } catch (error) {
      logger.warn('Error calling riskProfiler api')
      logger.warn(error)

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
      const oauthResult = await getRiskProfilerApiClientToken(username)
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

async function getRiskProfilerApiClientToken(username) {
  const oauthRiskProfilerClientToken = generateOauthClientToken()
  const oauthRequest = querystring.stringify({ grant_type: 'client_credentials', username })

  logger.info(`Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.apiClientId}'`)

  return superagent
    .post(oauthUrl)
    .set('Authorization', oauthRiskProfilerClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec)
}
