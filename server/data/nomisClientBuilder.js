const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')

const moment = require('moment')
const logger = require('../../log').default
const config = require('../config')
const { getApiClientToken } = require('../authentication/clientCredentials')
const getSanitisedError = require('../sanitisedError')

const timeoutSpec = {
  response: config.apis.elite2.timeout.response,
  deadline: config.apis.elite2.timeout.deadline,
}

const agentOptions = {
  maxSockets: config.apis.elite2.agent.maxSockets,
  maxFreeSockets: config.apis.elite2.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.elite2.agent.freeSocketTimeout,
}

const apiUrl = config.apis.elite2.url
const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

module.exports = context => {
  const nomisUserGet = nomisUserGetBuilder(context.user.token)
  const nomisClientGet = nomisClientGetBuilder(context.user.username)
  const nomisPost = nomisPushBuilder('post', context.user.token)
  const nomisClientPost = nomisClientPostBuilder(context.user.username)
  const nomisPut = nomisPushBuilder('put', context.user.token)
  const nomisClientPut = nomisClientPutBuilder(context.user.username)

  return {
    getUncategorisedOffenders(agencyId) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}?type=UNCATEGORISED`
      return nomisUserGet({ path })
    },
    getCategorisedOffenders(bookingIds) {
      const path = `${apiUrl}api/offender-assessments/category?latestOnly=false`
      return nomisClientPost({ path, body: bookingIds })
    },
    getLatestCategorisationForOffenders(offenderNos) {
      if (offenderNos.length === 0) return []
      const path = `${apiUrl}api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false`
      return nomisPost({ path, body: offenderNos })
    },
    getRecategoriseOffenders(agencyId, cutoff) {
      const path = `${apiUrl}api/offender-assessments/category/${agencyId}?type=RECATEGORISATIONS&date=${cutoff}`
      return nomisUserGet({ path })
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
      const path = `${apiUrl}api/offender-sentences/booking/${bookingId}/sentenceTerms`
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
    getOffenderDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}?basicInfo=false`
      return nomisClientGet({ path })
    },
    getBasicOffenderDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}?basicInfo=true`
      return nomisClientGet({ path })
    },
    getOffenderDetailsByOffenderNo(offenderNo) {
      const path = `${apiUrl}api/bookings/offenderNo/${offenderNo}?fullInfo=true`
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
      const path = `${apiUrl}api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false&activeOnly=false`
      return nomisUserGet({ path })
    },
    getAgencyDetail(agencyId) {
      const path = `${apiUrl}api/agencies/${agencyId}?activeOnly=false`
      return nomisUserGet({ path })
    },
    getAgencies() {
      const path = `${apiUrl}api/agencies/prison`
      return nomisClientGet({ path })
    },
    createCategorisation(details) {
      const path = `${apiUrl}api/offender-assessments/category/categorise`
      return nomisPost({ path, body: details })
    },
    updateCategorisation(details) {
      const path = `${apiUrl}api/offender-assessments/category/categorise`
      return nomisPut({ path, body: details })
    },
    createSupervisorApproval(details) {
      const path = `${apiUrl}api/offender-assessments/category/approve`
      return nomisPut({ path, body: details })
    },
    createSupervisorRejection(details) {
      const path = `${apiUrl}api/offender-assessments/category/reject`
      return nomisPut({ path, body: details })
    },
    getOffenderDetailList(offenderNos) {
      const path = `${apiUrl}api/bookings/offenders?activeOnly=false`
      return nomisClientPost({ path, body: offenderNos })
    },
    getUserDetailList(usernames) {
      const path = `${apiUrl}api/users/list`
      return nomisClientPost({ path, body: usernames })
    },
    updateNextReviewDate(bookingId, nextReviewDate) {
      const path = `${apiUrl}api/offender-assessments/category/${bookingId}/nextReviewDate/${nextReviewDate}`
      return nomisClientPut({ path })
    },
    setInactive(bookingId, assessmentStatus) {
      const path = `${apiUrl}api/offender-assessments/category/${bookingId}/inactive?status=${assessmentStatus}`
      return nomisClientPut({ path })
    },
    getIdentifiersByBookingId(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}/identifiers`
      return nomisClientGet({ path })
    },
    getOffenderAdjudications(offenderNos, fromDate, toDate, agencyId) {
      const path = `${apiUrl}api/offenders/adjudication-hearings?agencyId=${agencyId}&fromDate=${fromDate}&toDate=${toDate}`
      return nomisClientPost({ path, body: offenderNos })
    },
  }
}

function nomisUserGetBuilder(token) {
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    const time = moment()
    try {
      const result = await superagent
        .get(path)
        .agent(keepaliveAgent)
        .query(query)
        .set('Authorization', `Bearer ${token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      const durationMillis = moment().diff(time)
      logger.debug({ path, query, durationMillis }, 'Nomis GET using user credentials')
      return raw ? result : result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path, query }, 'Error in Nomis GET using user credentials')
      throw sanitisedError
    }
  }
}

function nomisClientGetBuilder(username) {
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    const time = moment()
    try {
      const clientToken = await getApiClientToken(username)

      const result = await superagent
        .get(path)
        .agent(keepaliveAgent)
        .query(query)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      const durationMillis = moment().diff(time)
      logger.debug({ path, query, durationMillis }, 'Nomis GET using clientId credentials')
      return raw ? result : result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path, query }, 'Error in Nomis GET using clientId credentials')
      throw sanitisedError
    }
  }
}

function nomisPushBuilder(verb, token) {
  const updateMethod = {
    put,
    post,
  }

  return async ({ path, body = {}, headers = {}, responseType = '' } = {}) => {
    const time = moment()
    try {
      const result = await updateMethod[verb](token, path, body, headers, responseType)

      const durationMillis = moment().diff(time)
      logger.debug({ path, body, durationMillis }, 'Nomis PUSH')
      return result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path }, 'Error in Nomis PUSH')
      throw sanitisedError
    }
  }
}

function nomisClientPostBuilder(username) {
  return async ({ path, body = {}, headers = {}, responseType = '' } = {}) => {
    const time = moment()
    try {
      const clientToken = await getApiClientToken(username)

      const result = await superagent
        .post(path)
        .agent(keepaliveAgent)
        .send(body)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)
      const durationMillis = moment().diff(time)
      logger.debug({ path, body, durationMillis }, 'Nomis POST')
      return result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path }, 'Error in Nomis POST')
      throw sanitisedError
    }
  }
}

function nomisClientPutBuilder(username) {
  return async ({ path, body = {}, headers = {}, responseType = '' } = {}) => {
    const time = moment()
    try {
      const clientToken = await getApiClientToken(username)

      const result = await superagent
        .put(path)
        .agent(keepaliveAgent)
        .send(body)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      const durationMillis = moment().diff(time)
      logger.debug({ path, body, durationMillis }, 'Nomis PUT')
      return result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error({ ...sanitisedError, path }, 'Error in Nomis PUT')
      throw sanitisedError
    }
  }
}

async function post(token, path, body, headers, responseType) {
  return superagent
    .post(path)
    .agent(keepaliveAgent)
    .send(body)
    .set('Authorization', `Bearer ${token}`)
    .set(headers)
    .responseType(responseType)
    .timeout(timeoutSpec)
}

async function put(token, path, body, headers, responseType) {
  return superagent
    .put(path)
    .agent(keepaliveAgent)
    .send(body)
    .set('Authorization', `Bearer ${token}`)
    .set(headers)
    .responseType(responseType)
    .timeout(timeoutSpec)
}
