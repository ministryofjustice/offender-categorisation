const db = require('./dataAccess/db')

module.exports = {
  getFormDataForUser(bookingId) {
    const query = {
      text: 'select id, form_response from form where booking_id = $1',
      values: [bookingId],
    }

    return db.query(query)
  },

  update(formId, formResponse, bookingId, offenderNo) {
    const query = {
      text: getUpsertQuery(formId),
      values: [formResponse, bookingId, offenderNo],
    }

    return db.query(query)
  },
}

function getUpsertQuery(formId) {
  if (formId) {
    return 'update form set form_response = $1 where booking_id = $2'
  }

  return 'insert into form (form_response, booking_id, offender_no) values ($1, $2, $3)'
}
