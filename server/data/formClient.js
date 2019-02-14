const db = require('./dataAccess/db')
const logger = require('../../log.js')

module.exports = {
  getFormDataForUser(bookingId) {
    const query = {
      text: `select id, user_id, status, form_response, assigned_user_id, referred_date, referred_by
        from form where booking_id = $1`,
      values: [bookingId],
    }

    return db.query(query)
  },

  update(formId, formResponse, bookingId, userId, status, assignedUserId) {
    logger.debug(`updating record for booking id ${bookingId}`)
    const query = formId
      ? {
          text: 'update form set form_response = $1 where booking_id = $2',
          values: [formResponse, bookingId],
        }
      : {
          text:
            'insert into form (form_response, booking_id, user_id, status, assigned_user_id) values ($1, $2, $3, $4, $5)',
          values: [formResponse, bookingId, userId, status, assignedUserId],
        }
    return db.query(query)
  },
}
