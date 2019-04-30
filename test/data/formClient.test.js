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

  test('it should pass on the correct sql', () => {
    formClient.getFormDataForUser('bookingId1')

    expect(db.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy"
        from form f where f.booking_id = $1 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`,
      values: ['bookingId1'],
    })
  })
})

describe('getCategorisationRecordsByStatus', () => {
  test('it should pass on the correct sql', () => {
    formClient.getCategorisationRecordsByStatus('MDI', ['APPROVED', 'AWAITING_APPROVAL'])

    expect(db.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy"
        from form f where f.prison_id = $1 and f.status = ANY ($2) and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`,
      values: ['MDI', ['APPROVED', 'AWAITING_APPROVAL']],
    })
  })
})

describe('getSecurityReviewedCategorisationRecords', () => {
  test('it should generate the correct sql', () => {
    formClient.getSecurityReviewedCategorisationRecords('MDI')

    expect(db.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy"
        from form f where f.prison_id = $1 and security_reviewed_date is not null and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`,
      values: ['MDI'],
    })
  })
})

describe('securityReviewed', () => {
  test('it should generate query to update security reviewed columns', () => {
    formClient.securityReviewed('12345', 'SECURITY', 'Meeeee')

    expect(db.query).toBeCalledWith({
      text:
        'update form f set security_reviewed_date = CURRENT_TIMESTAMP, security_reviewed_by = $1, status = $2 where booking_id = $3 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)',
      values: ['Meeeee', 'SECURITY', '12345'],
    })
  })
})

describe('update', () => {
  test('it should call query on db', () => {
    formClient.update('formId', {}, 'bookingId', null)
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should insert if no formId passed in', () => {
    formClient.update(undefined, {}, 'bookingId1', 'Meeeee', 'STARTED', 'colleague123', 'MDI', 'A4567RS')

    expect(db.query).toBeCalledWith({
      text:
        'insert into form (form_response, booking_id, user_id, status, assigned_user_id, sequence_no, prison_id, offender_no, start_date) values ($1, $2, $3, $4, $5, 1, $6, $7, CURRENT_TIMESTAMP)',
      values: [{}, 'bookingId1', 'Meeeee', 'STARTED', 'colleague123', 'MDI', 'A4567RS'],
    })
  })

  test('it should update if formId passed in', () => {
    formClient.update('formId', {}, 'bookingId1', 'Meeeee', 'STARTED', 'colleague123')

    expect(db.query).toBeCalledWith({
      text:
        'update form f set form_response = $1, status = $2 where f.booking_id = $3 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)',
      values: [{}, 'STARTED', 'bookingId1'],
    })
  })
})
