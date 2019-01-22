const formClient = require('../../server/data/formClient')
const db = require('../../server/data/dataAccess/db')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

describe('getFormDataForUser', () => {
  test('it should call query on db', () => {
    formClient.getFormDataForUser('bookingId1')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    formClient.getFormDataForUser('bookingId1')

    expect(db.query).toBeCalledWith({
      text: 'select id, form_response from form where booking_id = $1',
      values: ['bookingId1'],
    })
  })
})

describe('update', () => {
  test('it should call query on db', () => {
    formClient.update('formId', {}, 'bookingId')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should insert if no formId passed in', () => {
    formClient.update(undefined, {}, 'bookingId1', 'offenderNo')

    expect(db.query).toBeCalledWith({
      text: 'insert into form (form_response, booking_id, offender_no) values ($1, $2, $3)',
      values: [{}, 'bookingId1', 'offenderNo'],
    })
  })

  test('it should update if formId passed in', () => {
    formClient.update('formId', {}, 'bookingId1')

    expect(db.query).toBeCalledWith({
      text: 'update form set form_response = $1 where booking_id = $2',
      values: [{}, 'bookingId1', undefined],
    })
  })
})
