const db = require('./dataAccess/db')

module.exports = {
  getFormDataForUser(bookingId) {
    const query = {
      text: 'select id, form_response from form where booking_id = $1',
      values: [bookingId],
    }

    return db.query(query)
  },

  update(formId, formResponse, bookingId, userId) {
    const query = formId
      ? {
          text: 'update form set form_response = $1 where booking_id = $2',
          values: [formResponse, bookingId],
        }
      : {
          text: 'insert into form (form_response, booking_id, user_id) values ($1, $2, $3)',
          values: [formResponse, bookingId, userId],
        }
    return db.query(query)
  },
}
