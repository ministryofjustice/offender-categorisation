const logger = require('../../log.js')

const sequenceClause =
  'and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)'

module.exports = {
  getFormDataForUser(bookingId, transactionalClient) {
    const query = {
      text: `select id,
                    booking_id             as "bookingId",
                    sequence_no            as "sequence",
                    user_id                as "userId",
                    status,
                    form_response          as "formObject",
                    risk_profile           as "riskProfile",
                    assigned_user_id       as "assignedUserId",
                    referred_date          as "securityReferredDate",
                    referred_by            as "securityReferredBy",
                    security_reviewed_date as "securityReviewedDate",
                    security_reviewed_by   as "securityReviewedBy",
                    approval_date          as "approvalDate",
                    cat_type               as "catType"
             from form f
      where f.booking_id = $1 ${sequenceClause}`,
      values: [bookingId],
    }
    return transactionalClient.query(query)
  },

  getCategorisationRecordsByStatus(agencyId, statusList, transactionalClient) {
    logger.debug(`getCategorisationRecordsByStatus called for ${agencyId}, status ${statusList}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate"
        from form f where f.prison_id = $1 and f.status = ANY ($2) ${sequenceClause}`,
      values: [agencyId, statusList],
    }
    return transactionalClient.query(query)
  },

  getApprovedCategorisations(agencyId, fromDate, transactionalClient) {
    logger.debug(`getApprovedCategorisations called for ${agencyId}, date ${fromDate}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate"
        from form f where f.prison_id = $1 and f.status = $2 and approval_date >= $3 ${sequenceClause}`,
      values: [agencyId, 'APPROVED', fromDate],
    }
    return transactionalClient.query(query)
  },

  getSecurityReviewedCategorisationRecords(agencyId, transactionalClient) {
    logger.debug(`getSecurityReviewedOffenders called for ${agencyId}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate"
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

  supervisorApproval(formId, formResponse, bookingId, transactionalClient) {
    logger.debug(`recording supervisor approval for booking id ${bookingId}`)
    const query = {
      text: `update form f set form_response = $1, status = $2, approval_date = CURRENT_DATE where f.booking_id = $3 ${sequenceClause}`,
      values: [formResponse, 'APPROVED', bookingId],
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

  create({ bookingId, catType, userId, status, assignedUserId, prisonId, offenderNo, transactionalClient }) {
    logger.debug(`creating categorisation record for booking id ${bookingId}`)
    const query = {
      text: `insert into form (
              form_response, booking_id, user_id, status, assigned_user_id, sequence_no, prison_id, offender_no, start_date, cat_type
             ) values ($1, $2, $3, $4, $5, (
              select COALESCE(MAX(sequence_no), 0) + 1 from form where booking_id = $2
                 ), $6, $7, CURRENT_TIMESTAMP, $8
             )`,
      values: [{}, bookingId, userId, status, assignedUserId, prisonId, offenderNo, catType],
    }
    return transactionalClient.query(query)
  },
}
