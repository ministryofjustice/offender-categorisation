const formClient = require('../../server/data/formClient')
const moment = require('moment')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  mockTransactionalClient.query.mockReset()
})

describe('getFormDataForUser', () => {
  test('it should call query on db', () => {
    formClient.getFormDataForUser('bookingId1', mockTransactionalClient)
    expect(mockTransactionalClient.query).toBeCalledTimes(1)
  })

  test('it should pass on the correct sql', () => {
    formClient.getFormDataForUser('bookingId1', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select id,
                    booking_id             as "bookingId",
                    offender_no            as "offenderNo",
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
      where f.booking_id = $1 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`,
      values: ['bookingId1'],
    })
  })
})

describe('getCategorisationRecordsByStatus', () => {
  test('it should pass on the correct sql', () => {
    formClient.getCategorisationRecordsByStatus('MDI', ['APPROVED', 'AWAITING_APPROVAL'], mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType"
        from form f where f.prison_id = $1 and f.status = ANY ($2) and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`,
      values: ['MDI', ['APPROVED', 'AWAITING_APPROVAL']],
    })
  })
})

describe('supervisorApproval', () => {
  test('it should pass on the correct sql', () => {
    const fromDate = moment('2013-03-01', 'YYYY-MM-DD').toDate()
    formClient.getApprovedCategorisations('MDI', fromDate, 'RECAT', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType", nomis_sequence_no as "nomisSeq"
        from form f where f.prison_id = $1 and f.status = $2 and approval_date >= $3 and ($4::cat_type_enum is null or cat_type = $4::cat_type_enum) and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`,
      values: ['MDI', 'APPROVED', fromDate, 'RECAT'],
    })
  })
})

describe('getSecurityReviewedCategorisationRecords', () => {
  test('it should generate the correct sql', () => {
    formClient.getSecurityReviewedCategorisationRecords('MDI', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType"
        from form f where f.prison_id = $1 and security_reviewed_date is not null and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`,
      values: ['MDI'],
    })
  })
})

describe('securityReviewed', () => {
  test('it should generate query to update security reviewed columns', () => {
    formClient.securityReviewed('12345', 'SECURITY', 'Meeeee', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text:
        'update form f set security_reviewed_date = CURRENT_TIMESTAMP, security_reviewed_by = $1, status = $2 where booking_id = $3 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)',
      values: ['Meeeee', 'SECURITY', '12345'],
    })
  })
})

describe('updateRecordWithNomisSeqNumber', () => {
  test('it should generate query to update record with nomis sequence number', () => {
    formClient.updateRecordWithNomisSeqNumber('12345', 4, mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text:
        'update form f set nomis_sequence_no = $1 where booking_id = $2 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)',
      values: [4, '12345'],
    })
  })
})

describe('create categorisation record', () => {
  test('create categorisation record', () => {
    formClient.create({
      bookingId: 'bookingId1',
      sequence: 5,
      catType: 'RECAT',
      userId: 'Meeeee',
      status: 'STARTED',
      assignedUserId: 'colleague123',
      prisonId: 'MDI',
      offenderNo: 'A4567RS',
      transactionalClient: mockTransactionalClient,
    })

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `insert into form (
              form_response, booking_id, user_id, status, assigned_user_id, sequence_no, prison_id, offender_no, start_date, cat_type
             ) values ($1, $2, $3, $4, $5, (
              select COALESCE(MAX(sequence_no), 0) + 1 from form where booking_id = $2
                 ), $6, $7, CURRENT_TIMESTAMP, $8
             )`,
      values: [{}, 'bookingId1', 'Meeeee', 'STARTED', 'colleague123', 'MDI', 'A4567RS', 'RECAT'],
    })
  })
})

describe('categorisation record update', () => {
  test('it should update the categorisation record', () => {
    formClient.update({}, 'bookingId1', 'STARTED', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text:
        'update form f set form_response = $1, status = $2 where f.booking_id = $3 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)',
      values: [{}, 'STARTED', 'bookingId1'],
    })
  })
})

describe('supervisorApproval update', () => {
  test('it should update the categorisation record with a supervisor approval', () => {
    formClient.supervisorApproval({}, 'bookingId1', 'Me', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text:
        'update form f set form_response = $1, status = $2, approved_by = $3, approval_date = CURRENT_DATE where f.booking_id = $4 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)',
      values: [{}, 'APPROVED', 'Me', 'bookingId1'],
    })
  })
})
