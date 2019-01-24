const db = require('./dataAccess/db')
const logger = require('../../log.js')

module.exports = {
  getFormDataForUser(bookingId) {
    const query = {
      text: 'select id, user_id, status, form_response from form where booking_id = $1',
      values: [bookingId],
    }

    return db.query(query)
  },

  update(formId, formResponse, bookingId, userId, status) {
    logger.debug(`updating record for booking id ${bookingId}`)
    const query = formId
      ? {
          text: 'update form set form_response = $1 where booking_id = $2',
          values: [formResponse, bookingId],
        }
      : {
          text: 'insert into form (form_response, booking_id, user_id, status) values ($1, $2, $3, $4)',
          values: [formResponse, bookingId, userId, status],
        }
    return db.query(query)
  },
}
