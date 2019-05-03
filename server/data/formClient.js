const logger = require('../../log.js')

const sequenceClause =
  'and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)'

module.exports = {
  getFormDataForUser(bookingId, transactionalClient) {
    const query = {
      text: `select id,
                    booking_id             as "bookingId",
                    user_id                as "userId",
                    status,
                    form_response          as "formObject",
                    risk_profile           as "riskProfile",
                    assigned_user_id       as "assignedUserId",
                    referred_date          as "securityReferredDate",
                    referred_by            as "securityReferredBy",
                    security_reviewed_date as "securityReviewedDate",
                    security_reviewed_by   as "securityReviewedBy"
             from form f
      where f.booking_id = $1 ${sequenceClause}`,
      values: [bookingId],
    }
    return transactionalClient.query(query)
  },

  getCategorisationRecordsByStatus(agencyId, statusList, transactionalClient) {
    logger.debug(`getCategorisationRecordsByStatus called for ${agencyId}, status ${statusList}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy"
        from form f where f.prison_id = $1 and f.status = ANY ($2) ${sequenceClause}`,
      values: [agencyId, statusList],
    }
    return transactionalClient.query(query)
  },

  getSecurityReviewedCategorisationRecords(agencyId, transactionalClient) {
    logger.debug(`getSecurityReviewedOffenders called for ${agencyId}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy"
        from form f where f.prison_id = $1 and security_reviewed_date is not null ${sequenceClause}`,
      values: [agencyId],
    }
    return transactionalClient.query(query)
  },

  referToSecurity(bookingId, userId, status, transactionalClient) {
    logger.debug(`referToSecurity called for ${userId}, status ${status} and booking id ${bookingId}`)
    const query = {
      text: `update form f set status = $1, referred_date = CURRENT_TIMESTAMP, referred_by = $2 where booking_id = $3 ${sequenceClause}`,
      values: [status, userId, bookingId],
    }
    return transactionalClient.query(query)
  },

  securityReviewed(bookingId, status, userId, transactionalClient) {
    logger.debug(`securityReviewed called for ${userId} with status ${status} and booking id ${bookingId}`)
    const query = {
      text: `update form f set security_reviewed_date = CURRENT_TIMESTAMP, security_reviewed_by = $1, status = $2 where booking_id = $3 ${sequenceClause}`,
      values: [userId, status, bookingId],
    }
    return transactionalClient.query(query)
  },

  updateStatus(bookingId, status, transactionalClient) {
    logger.debug(`updateStatus called for booking id ${bookingId} and status ${status}`)
    const query = {
      text: `update form f set status = $1 where booking_id = $2 ${sequenceClause}`,
      values: [status, bookingId],
    }
    return transactionalClient.query(query)
  },

  updateFormData(bookingId, formResponse, transactionalClient) {
    logger.debug(`updateFormData for booking id ${bookingId}`)
    const query = {
      text: `update form f set form_response = $1 where booking_id = $2 ${sequenceClause}`,
      values: [formResponse, bookingId],
    }
    return transactionalClient.query(query)
  },

  updateRiskProfileData(bookingId, data, transactionalClient) {
    logger.debug(`mergeRiskProfileData for booking id ${bookingId}`)
    const query = {
      text: `update form f set risk_profile = $1 where booking_id = $2 ${sequenceClause}`,
      values: [data, bookingId],
    }
    return transactionalClient.query(query)
  },

  update(formId, formResponse, bookingId, status, transactionalClient) {
    logger.debug(`updating record for booking id ${bookingId}`)
    const query = {
      text: `update form f set form_response = $1, status = $2 where f.booking_id = $3 ${sequenceClause}`,
      values: [formResponse, status, bookingId],
    }
    return transactionalClient.query(query)
  },

  create(bookingId, userId, status, assignedUserId, prisonId, offenderNo, transactionalClient) {
    logger.debug(`creating categorisation record for booking id ${bookingId}`)
    const query = {
      text:
        'insert into form (form_response, booking_id, user_id, status, assigned_user_id, sequence_no, prison_id, offender_no, start_date) values ($1, $2, $3, $4, $5, 1, $6, $7, CURRENT_TIMESTAMP)',
      values: [{}, bookingId, userId, status, assignedUserId, prisonId, offenderNo],
    }
    return transactionalClient.query(query)
  },
}
