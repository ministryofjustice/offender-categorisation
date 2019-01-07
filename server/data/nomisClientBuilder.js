/* eslint-disable no-unused-vars */
const logger = require('../../log')
const config = require('../config')
const superagent = require('superagent')
const { NoTokenError } = require('../utils/errors')

const timeoutSpec = {
  response: config.apis.elite2.timeout.response,
  deadline: config.apis.elite2.timeout.deadline,
}

const apiUrl = config.apis.elite2.url

module.exports = token => {
  const nomisGet = nomisGetBuilder(token)
  const nomisPost = nomisPushBuilder('post', token)
  const nomisPut = nomisPushBuilder('put', token)

  return {
    getOffendersInPrison(agencyId) {
      const path = `${apiUrl}/bookings/${agencyId}`
      return nomisGet({ path })
    },
  }
}

function nomisGetBuilder(token) {
  return async ({ path, query = '', headers = {}, responseType = '' } = {}) => {
    if (!token) {
      throw new NoTokenError()
    }

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
    if (!token) {
      throw new NoTokenError()
    }

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
