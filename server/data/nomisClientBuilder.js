/* eslint-disable no-unused-vars */
const logger = require('../../log')
const config = require('../config')
const superagent = require('superagent')
const querystring = require('querystring')
const { generateOauthClientToken } = require('../authentication/clientCredentials')

const timeoutSpec = {
  response: config.apis.elite2.timeout.response,
  deadline: config.apis.elite2.timeout.deadline,
}

const apiUrl = config.apis.elite2.url
const oauthUrl = `${config.apis.oauth2.url}/oauth/token`

module.exports = token => {
  const nomisGet = nomisGetBuilder(token)
  const nomisPost = nomisPushBuilder('post', token)
  const nomisPut = nomisPushBuilder('put', token)

  return {
    getUncategorisedOffenders(agencyId) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}/uncategorised`
      return nomisGet({ path })
    },
    getSentenceDatesForOffenders(bookingIds) {
      const path = `${apiUrl}api/offender-sentences`
      return nomisPost({ path, body: bookingIds })
    },
    getUser() {
      const path = `${apiUrl}api/users/me`
      return nomisGet({ path })
    },
  }
}

function nomisGetBuilder(token) {
  return async ({ path, query = '', headers = {}, responseType = '' } = {}) => {
    logger.info(`nomisGet: calling elite2api: ${path} ${query}`)
    try {
      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return result.body
    } catch (error) {
      logger.warn('Error calling elite2api')
      logger.warn(error)

      throw error
    }
  }
}

function nomisPushBuilder(verb, token) {
  const updateMethod = {
    put,
    post,
  }

  return async ({ path, body = '', headers = {}, responseType = '' } = {}) => {
    logger.info(`nomisPush: calling elite2api: ${path}`)
    logger.debug(`nomisPush: body: ${body}`)
    try {
      const result = await updateMethod[verb](token, path, body, headers, responseType)
      return result.body
    } catch (error) {
      logger.warn('Error calling elite2api')
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
