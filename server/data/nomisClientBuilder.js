const logger = require('../../log')
const config = require('../config')
const superagent = require('superagent')
const { getApiClientToken } = require('../authentication/clientCredentials')

const timeoutSpec = {
  response: config.apis.elite2.timeout.response,
  deadline: config.apis.elite2.timeout.deadline,
}

const apiUrl = config.apis.elite2.url

module.exports = token => {
  const nomisUserGet = nomisUserGetBuilder(token)
  const nomisClientGet = nomisClientGetBuilder()
  const nomisPost = nomisPushBuilder('post', token)
  const nomisPut = nomisPushBuilder('put', token)

  return {
    getUncategorisedOffenders(agencyId) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}?type=UNCATEGORISED`
      return nomisUserGet({ path })
    },
    getCategorisedOffenders(agencyId, bookingIds) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}`
      return nomisPost({ path, body: bookingIds })
    },
    getRecategoriseOffenders(agencyId) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}?type=RECATEGORISATIONS` // &date=${cutoff}`
      return nomisUserGet({ path })
    },
    getSentenceDatesForOffenders(bookingIds) {
      const path = `${apiUrl}api/offender-sentences/bookings`
      return nomisPost({ path, body: bookingIds })
    },
    getSentenceHistory(offenderNo) {
      const path = `${apiUrl}api/offender-sentences?offenderNo=${offenderNo}`
      return nomisUserGet({ path })
    },
    getSentenceDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}/sentenceDetail`
      return nomisClientGet({ path })
    },
    getSentenceTerms(bookingId) {
      const path = `${apiUrl}api/offender-sentences/booking/${bookingId}/sentenceTerms?earliestOnly=false`
      return nomisClientGet({ path })
    },
    getUser() {
      const path = `${apiUrl}api/users/me`
      return nomisUserGet({ path })
    },
    getUserByUserId(userId) {
      const path = `${apiUrl}api/users/${userId}`
      return nomisUserGet({ path })
    },
    getUserCaseLoads() {
      const path = `${apiUrl}api/users/me/caseLoads`
      return nomisUserGet({ path })
    },
    getImageData(imageId) {
      const path = `${apiUrl}api/images/${imageId}/data`
      return nomisUserGet({ path, responseType: 'stream', raw: true })
    },
    async getOffenderDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}?basicInfo=false`
      return nomisClientGet({ path })
    },
    getMainOffence(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}/mainOffence`
      return nomisClientGet({ path })
    },
    getOffenceHistory(offenderNo) {
      const path = `${apiUrl}api/bookings/offenderNo/${offenderNo}/offenceHistory`
      return nomisUserGet({ path })
    },
    getCategoryHistory(offenderNo) {
      const path = `${apiUrl}api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false`
      return nomisUserGet({ path })
    },
    getCategory(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}/assessment/CATEGORY`
      return nomisUserGet({ path })
    },
    getAgencyDetail(agencyId) {
      const path = `${apiUrl}api/agencies/${agencyId}`
      return nomisUserGet({ path })
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

function nomisUserGetBuilder(token) {
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    logger.info(`nomis Get using user credentials: calling elite2api: ${path} ${query}`)
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
      logger.warn(error, 'Error calling elite2api')
      throw error
    }
  }
}

function nomisClientGetBuilder(username) {
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    logger.info(`nomis Get using clientId credentials: calling elite2api: ${path} ${query}`)
    try {
      const clientToken = await getApiClientToken(username)

      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return raw ? result : result.body
    } catch (error) {
      logger.warn(error, 'Error calling elite2api')
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
