const moment = require('moment')
const formClient = require('../../server/data/formClient')
const RiskChangeStatus = require('../../server/utils/riskChangeStatusEnum')

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
                    prison_id              as "prisonId",
                    cat_type               as "catType",
                    review_reason          as "reviewReason",
                    nomis_sequence_no      as "nomisSeq" from form f where f.booking_id = $1 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and f2.status <> 'CANCELLED' and f2.status <> 'CANCELLED_RELEASE')`,
      values: ['bookingId1'],
    })
  })
})

describe('getCategorisationRecordsByStatus', () => {
  test('it should pass on the correct sql', () => {
    formClient.getCategorisationRecordsByStatus('MDI', ['APPROVED', 'AWAITING_APPROVAL'], mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType", prison_id as prisonId
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
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", approved_by as "approvedBy", offender_no as "offenderNo", cat_type as "catType", nomis_sequence_no as "nomisSeq", sequence_no as "sequence"
        from form f where f.prison_id = $1 and f.status = $2 and f.approval_date >= $3 and ($4::cat_type_enum is null or f.cat_type = $4::cat_type_enum) and f.status <> 'CANCELLED' and f.status <> 'CANCELLED_RELEASE'`,
      values: ['MDI', 'APPROVED', fromDate, 'RECAT'],
    })
  })
})

describe('getSecurityReviewedCategorisationRecords', () => {
  test('it should generate the correct sql', () => {
    formClient.getSecurityReviewedCategorisationRecords('MDI', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType"
        from form f where f.prison_id = $1 and f.security_reviewed_date is not null and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and f2.status <> 'CANCELLED' and f2.status <> 'CANCELLED_RELEASE')`,
      values: ['MDI'],
    })
  })
})

describe('securityReviewed', () => {
  test('it should generate query to update security reviewed columns', () => {
    formClient.securityReviewed('12345', 'SECURITY', 'Meeeee', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `update form f set security_reviewed_date = CURRENT_TIMESTAMP, security_reviewed_by = $1, status = $2 where f.booking_id = $3 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and f2.status <> 'CANCELLED' and f2.status <> 'CANCELLED_RELEASE')`,
      values: ['Meeeee', 'SECURITY', '12345'],
    })
  })
})

describe('updateRecordWithNomisSeqNumber', () => {
  test('it should generate query to update record with nomis sequence number', () => {
    formClient.updateRecordWithNomisSeqNumber('12345', 4, mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: "update form f set nomis_sequence_no = $1 where f.booking_id = $2 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and f2.status <> 'CANCELLED' and f2.status <> 'CANCELLED_RELEASE')",
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
      reviewReason: 'DUE',
      dueByDate: '2019-06-04',
      transactionalClient: mockTransactionalClient,
    })

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `insert into form (
              form_response, booking_id, user_id, status, assigned_user_id, sequence_no, prison_id, offender_no, start_date, cat_type, review_reason, due_by_date
             ) values ($1, $2, $3, $4, $5, (
              select COALESCE(MAX(sequence_no), 0) + 1 from form where booking_id = $2
                 ), $6, $7, CURRENT_TIMESTAMP, $8, $9, $10
             )`,
      values: [{}, 'bookingId1', 'Meeeee', 'STARTED', 'colleague123', 'MDI', 'A4567RS', 'RECAT', 'DUE', '2019-06-04'],
    })
  })
})

describe('categorisation record update', () => {
  test('it should update the categorisation record', () => {
    formClient.update({}, 'bookingId1', 'STARTED', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: "update form f set form_response = $1, status = $2 where f.booking_id = $3 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and f2.status <> 'CANCELLED' and f2.status <> 'CANCELLED_RELEASE')",
      values: [{}, 'STARTED', 'bookingId1'],
    })
  })
})

describe('supervisorApproval update', () => {
  test('it should update the categorisation record with a supervisor approval', () => {
    formClient.supervisorApproval({}, 'bookingId1', 'Me', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: "update form f set form_response = $1, status = $2, approved_by = $3, approval_date = CURRENT_DATE where f.booking_id = $4 and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and f2.status <> 'CANCELLED' and f2.status <> 'CANCELLED_RELEASE')",
      values: [{}, 'APPROVED', 'Me', 'bookingId1'],
    })
  })
})

describe('createRiskChange', () => {
  test('it should create a risk change record with a status of new', () => {
    formClient.createRiskChange({
      agencyId: 'LEI',
      offenderNo: 'ABC123',
      oldProfile: '{old}',
      newProfile: '{new}',
      transactionalClient: mockTransactionalClient,
    })

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: 'insert into risk_change ( prison_id, offender_no, old_profile, new_profile, raised_date ) values ($1, $2, $3, $4, CURRENT_TIMESTAMP )',

      values: ['LEI', 'ABC123', '{old}', '{new}'],
    })
  })
})

describe('getRiskChangeByStatus', () => {
  test('it should retrieve a list of risk change records by agency and status', () => {
    formClient.getRiskChangeByStatus('LEI', RiskChangeStatus.NEW.name, mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: 'select offender_no as "offenderNo", user_id as "userId", status, raised_date as "raisedDate" from risk_change f where f.prison_id= $1 and f.status = $2',

      values: ['LEI', 'NEW'],
    })
  })
})

describe('getNewRiskChangeByOffender', () => {
  test('it should any risk change record by offender', () => {
    formClient.getNewRiskChangeByOffender('GN12345', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: 'select old_profile as "oldProfile", new_profile as "newProfile", status, raised_date as "raisedDate" from risk_change r where r.offender_no= $1 and r.status = \'NEW\'',

      values: ['GN12345'],
    })
  })
})

describe('mergeRiskChangeForOffender', () => {
  test('it should update the risk change record by offender with a status of NEW', () => {
    formClient.mergeRiskChangeForOffender('GN12345', { hello: 'hello' }, mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: "update risk_change set new_profile = $2, raised_date = CURRENT_TIMESTAMP where offender_no= $1 and status = 'NEW'",

      values: ['GN12345', { hello: 'hello' }],
    })
  })
})

describe('updateNewRiskChangeStatus', () => {
  test('it should update the risk change record (if a changed record with NEW status exists) by offender with the given status', () => {
    formClient.updateNewRiskChangeStatus({
      offenderNo: 'GN12345',
      userId: 'Me',
      status: 'REVIEW_REQUIRED',
      transactionalClient: mockTransactionalClient,
    })

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: "update risk_change set status = $1, user_id = $2 where offender_no = $3 and status = 'NEW'",

      values: ['REVIEW_REQUIRED', 'Me', 'GN12345'],
    })
  })
})

describe('deleteLiteCategorisation', () => {
  test('it should delete the lite categorisation', () => {
    formClient.deleteLiteCategorisation({
      bookingId: 1,
      sequence: 1,
      transactionalClient: mockTransactionalClient,
    })

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `delete from lite_category where booking_id = $1 and sequence = $2`,
      values: [1, 1],
    })
  })
})

describe('getSecurityReferrals', () => {
  test('it a list of security referracls', () => {
    formClient.getSecurityReferrals('MDI', mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select prison_id   as "prisonId",
                    user_id     as "userId",
                    status,
                    raised_date as "raisedDate",
                    offender_no as "offenderNo",
                    processed_date as "processedDate"
             from security_referral s
             where prison_id = $1 `,
      values: ['MDI'],
    })
  })
})

describe('getPendingCategorisations', () => {
  test('is should get a list of pending categorisations for a given offender number', () => {
    const fakeOffenderNumber = 'T1234567'

    formClient.getPendingCategorisations(fakeOffenderNumber, mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select f.id, f.booking_id, f.status, f.cat_type
             from form f
             where f.offender_no = $1
             and f.approval_date is null
             and f.approved_by is null
             and f.status in (
                'UNCATEGORISED',
                'STARTED',
                'SECURITY_MANUAL',
                'SECURITY_AUTO',
                'SECURITY_FLAGGED',
                'SECURITY_BACK',
                'AWAITING_APPROVAL',
                'SUPERVISOR_BACK'
             );`,
      values: [fakeOffenderNumber],
    })
  })
})

describe('getPendingLiteCategorisations', () => {
  test('is should get a list of pending lite categorisations for a given offender number', () => {
    const fakeOffenderNumber = 'T1234567'

    formClient.getPendingLiteCategorisations(fakeOffenderNumber, mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `select lc.booking_id, lc.sequence
             from public.lite_category lc
             where lc.offender_no = $1
             and lc.approved_date is null
             and lc.approved_by is null;`,
      values: [fakeOffenderNumber],
    })
  })
})

describe('deleteCategorisation', () => {
  test('is should delete a categorisation by categorisation id', () => {
    const fakeCategorisationId = 987123

    formClient.deleteCategorisation(fakeCategorisationId, mockTransactionalClient)

    expect(mockTransactionalClient.query).toBeCalledWith({
      text: `delete from form f where f.id=$1`,
      values: [fakeCategorisationId],
    })
  })
})
