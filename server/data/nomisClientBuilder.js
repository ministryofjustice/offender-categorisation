const logger = require('../../log')
const config = require('../config')
const superagent = require('superagent')

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
    getUncategorisedOffenders(agencyId) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}/uncategorised`
      return nomisGet({ path })
    },
    getCategorisedOffenders(agencyId, bookingIds) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}`
      return nomisPost({ path, body: bookingIds })
    },
    getSentenceDatesForOffenders(bookingIds) {
      const path = `${apiUrl}api/offender-sentences/bookings`
      return nomisPost({ path, body: bookingIds })
    },
    getSentenceHistory(offenderNo) {
      const path = `${apiUrl}api/offender-sentences?offenderNo=${offenderNo}`
      return nomisGet({ path })
    },
    getSentenceDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}/sentenceDetail`
      return nomisGet({ path })
    },
    getSentenceTerms(bookingId) {
      const path = `${apiUrl}api/offender-sentences/booking/${bookingId}/sentenceTerms`
      return nomisGet({ path })
    },
    getUser() {
      const path = `${apiUrl}api/users/me`
      return nomisGet({ path })
    },
    getUserByUserId(userId) {
      const path = `${apiUrl}api/users/${userId}`
      return nomisGet({ path })
    },
    getUserCaseLoads() {
      const path = `${apiUrl}api/users/me/caseLoads`
      return nomisGet({ path })
    },
    getImageData(imageId) {
      const path = `${apiUrl}api/images/${imageId}/data`
      return nomisGet({ path, responseType: 'stream', raw: true })
    },
    getOffenderDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}?basicInfo=false`
      return nomisGet({ path })
    },
    getMainOffence(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}/mainOffence`
      return nomisGet({ path })
    },
    getOffenceHistory(offenderNo) {
      const path = `${apiUrl}api/bookings/offenderNo/${offenderNo}/offenceHistory`
      return nomisGet({ path })
    },
    getCategoryHistory(offenderNo) {
      const path = `${apiUrl}api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false`
      return nomisGet({ path })
    },
    createSupervisorApproval(details) {
      const path = `${apiUrl}api/offender-assessments/category/approve`
      return nomisPut({ path, body: details })
    },
    createInitialCategorisation(details) {
      const path = `${apiUrl}api/offender-assessments/category/categorise`
      return nomisPost({ path, body: details })
    },
    getOffenderDetailList(agencyId, bookingIds) {
      const path = `${apiUrl}api/bookings/offenders/${agencyId}/list`
      return nomisPost({ path, body: bookingIds })
    },
    getUserDetailList(usernames) {
      const path = `${apiUrl}api/users/list`
      return nomisPost({ path, body: usernames })
    },
  }
}

function nomisGetBuilder(token) {
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    logger.info(`nomisGet: calling elite2api: ${path} ${query}`)
    try {
      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return raw ? result : result.body
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
