const db = require('./dataAccess/db')
const logger = require('../../log.js')

const sequenceClause =
  'and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)'

module.exports = {
  getFormDataForUser(bookingId) {
    const query = {
      text: `select id, booking_id, user_id, status, form_response, assigned_user_id, referred_date, referred_by, security_reviewed_date, security_reviewed_by
        from form f where f.booking_id = $1 ${sequenceClause}`,
      values: [bookingId],
    }
    return db.query(query)
  },

  getCategorisationRecordsByStatus(agencyId, statusList) {
    logger.debug(`getCategorisationRecordsByStatus called for ${agencyId}, status ${statusList}`)
    const query = {
      text: `select id, booking_id, user_id, status, form_response, assigned_user_id, referred_date, referred_by, security_reviewed_date, security_reviewed_by
        from form f where f.prison_id = $1 and f.status = ANY ($2) ${sequenceClause}`,
      values: [agencyId, statusList],
    }
    return db.query(query)
  },

  getSecurityReviewedCategorisationRecords(agencyId) {
    logger.debug(`getSecurityReviewedOffenders called for ${agencyId}`)
    const query = {
      text: `select id, booking_id, user_id, status, form_response, assigned_user_id, referred_date, referred_by, security_reviewed_date, security_reviewed_by
        from form f where f.prison_id = $1 and security_reviewed_date is not null ${sequenceClause}`,
      values: [agencyId],
    }
    return db.query(query)
  },

  referToSecurity(bookingId, userId, status) {
    logger.debug(`referToSecurity called for ${userId}, status ${status} and booking id ${bookingId}`)
    const query = {
      text: `update form f set status = $1, referred_date = CURRENT_TIMESTAMP, referred_by = $2 where booking_id = $3 ${sequenceClause}`,
      values: [status, userId, bookingId],
    }
    return db.query(query)
  },

  securityReviewed(bookingId, status, userId) {
    logger.debug(`securityReviewed called for ${userId} with status ${status} and booking id ${bookingId}`)
    const query = {
      text: `update form f set security_reviewed_date = CURRENT_TIMESTAMP, security_reviewed_by = $1, status = $2 where booking_id = $3 ${sequenceClause}`,
      values: [userId, status, bookingId],
    }
    return db.query(query)
  },

  updateStatus(bookingId, status) {
    logger.debug(`updateStatus called for booking id ${bookingId} and status ${status}`)
    const query = {
      text: `update form f set status = $1 where booking_id = $2 ${sequenceClause}`,
      values: [status, bookingId],
    }
    return db.query(query)
  },

  updateFormData(bookingId, formResponse) {
    logger.debug(`updateFormData for booking id ${bookingId}`)
    const query = {
      text: `update form f set form_response = $1 where booking_id = $2 ${sequenceClause}`,
      values: [formResponse, bookingId],
    }
    return db.query(query)
  },

  update(formId, formResponse, bookingId, userId, status, assignedUserId, prisonId, offenderNo) {
    logger.debug(`updating record for booking id ${bookingId}`)
    const query = formId
      ? {
          text: `update form f set form_response = $1, status = $2 where f.booking_id = $3 ${sequenceClause}`,
          values: [formResponse, status, bookingId],
        }
      : {
          text:
            'insert into form (form_response, booking_id, user_id, status, assigned_user_id, sequence_no, prison_id, offender_no, start_date) values ($1, $2, $3, $4, $5, 1, $6, $7, CURRENT_TIMESTAMP)',
          values: [formResponse, bookingId, userId, status, assignedUserId, prisonId, offenderNo],
        }
    return db.query(query)
  },
}
