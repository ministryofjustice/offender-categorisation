const moment = require('moment')
const serviceCreator = require('../../server/services/offendersService')
const Status = require('../../server/utils/statusEnum')
const ReviewReason = require('../../server/utils/reviewReasonEnum')
const RiskChangeStatus = require('../../server/utils/riskChangeStatusEnum')
const CatType = require('../../server/utils/catTypeEnum')
const { dateConverter } = require('../../server/utils/utils')
const { DUE_DATE, OVERDUE } = require('../../server/services/filter/homeFilter')
const { LEGAL_STATUS_REMAND } = require('../../server/data/prisonerSearch/prisonerSearch.dto')

const DATE_MATCHER = '\\d{2}/\\d{2}/\\d{4}'
const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const context = { user: { token: 'token', username: 'username', activeCaseLoad: { caseLoadId: 'LEI' } } }

const nomisClient = {
  getUncategorisedOffenders: jest.fn(),
  getRecategoriseOffenders: jest.fn(),
  getUserByUserId: jest.fn(),
  getOffenderDetails: jest.fn(),
  getOffenderDetailList: jest.fn(),
  getUserDetailList: jest.fn(),
  getSentenceDetails: jest.fn(),
  getSentenceTerms: jest.fn(),
  getMainOffence: jest.fn(),
  createCategorisation: jest.fn(),
  updateCategorisation: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createSupervisorRejection: jest.fn(),
  getCategoryHistory: jest.fn(),
  getAgencyDetail: jest.fn(),
  getCategorisedOffenders: jest.fn(),
  getLatestCategorisationForOffenders: jest.fn(),
  updateNextReviewDate: jest.fn(),
  getBasicOffenderDetails: jest.fn(),
  getIdentifiersByBookingId: jest.fn(),
  setInactive: jest.fn(),
  getOffenderPrisonPeriods: jest.fn(),
}

const prisonerSearchClient = {
  getPrisonersAtLocation: jest.fn(),
  getPrisonersByBookingIds: jest.fn(),
}

const allocationClient = {
  getPomByOffenderNo: jest.fn(),
}

const risksAndNeedsClient = {
  getRisksSummary: jest.fn(),
}

const probationOffenderSearchApiClient = {
  matchPrisoners: jest.fn(),
}

const formService = {
  getCategorisationRecord: jest.fn(),
  getSecurityReferredOffenders: jest.fn(),
  getCategorisedOffenders: jest.fn(),
  updateStatusForOutstandingRiskChange: jest.fn(),
  getRiskChanges: jest.fn(),
  getHistoricalCategorisationRecords: jest.fn(),
  getCategorisationRecords: jest.fn(),
  backToCategoriser: jest.fn(),
  recordNomisSeqNumber: jest.fn(),
  updateOffenderIdentifierReturningBookingId: jest.fn(),
  recordLiteCategorisation: jest.fn(),
  approveLiteCategorisation: jest.fn(),
  getUnapprovedLite: jest.fn(),
  getLiteCategorisation: jest.fn(),
  updatePrisonLite: jest.fn(),
  updatePrisonForm: jest.fn(),
  updatePrisonRiskChange: jest.fn(),
  updatePrisonSecurityReferral: jest.fn(),
  getSecurityReferrals: jest.fn(),
}

const nomisClientBuilder = () => nomisClient
const allocationClientBuilder = () => allocationClient
const prisonerSearchClientBuilder = () => prisonerSearchClient
const risksAndNeedsClientBuilder = () => risksAndNeedsClient
const probationOffenderSearchClientBuilder = () => probationOffenderSearchApiClient

let service

beforeEach(() => {
  service = serviceCreator(
    nomisClientBuilder,
    allocationClientBuilder,
    formService,
    prisonerSearchClientBuilder,
    risksAndNeedsClientBuilder,
    probationOffenderSearchClientBuilder,
  )
  formService.getCategorisationRecord.mockReturnValue({})
  formService.getLiteCategorisation.mockReturnValue({})
  formService.getSecurityReferrals.mockResolvedValue([])
  allocationClient.getPomByOffenderNo.mockResolvedValue({ primary_pom: { name: 'RENDELL, STEVE' } })
})

afterEach(() => {
  nomisClient.getUncategorisedOffenders.mockReset()
  nomisClient.getRecategoriseOffenders.mockReset()
  prisonerSearchClient.getPrisonersByBookingIds.mockReset()
  nomisClient.getUserByUserId.mockReset()
  nomisClient.getOffenderDetails.mockReset()
  nomisClient.getOffenderDetailList.mockReset()
  nomisClient.getUserDetailList.mockReset()
  nomisClient.getSentenceDetails.mockReset()
  nomisClient.getSentenceTerms.mockReset()
  nomisClient.getMainOffence.mockReset()
  nomisClient.createCategorisation.mockReset()
  nomisClient.updateCategorisation.mockReset()
  nomisClient.createSupervisorApproval.mockReset()
  formService.getCategorisationRecord.mockReset()
  formService.getSecurityReferredOffenders.mockReset()
  formService.getCategorisedOffenders.mockReset()
  formService.getHistoricalCategorisationRecords.mockReset()
  formService.getCategorisationRecords.mockReset()
  nomisClient.getCategoryHistory.mockReset()
  nomisClient.getAgencyDetail.mockReset()
  nomisClient.getCategorisedOffenders.mockReset()
  nomisClient.getLatestCategorisationForOffenders.mockReset()
  nomisClient.updateNextReviewDate.mockReset()
  nomisClient.getBasicOffenderDetails.mockReset()
  formService.getLiteCategorisation.mockReset()
  formService.updatePrisonLite.mockReset()
  formService.updatePrisonForm.mockReset()
  formService.updatePrisonRiskChange.mockReset()
  formService.updatePrisonSecurityReferral.mockReset()
  risksAndNeedsClient.getRisksSummary.mockReset()
  probationOffenderSearchApiClient.matchPrisoners.mockReset()
})

moment.now = jest.fn()
// NOTE: mock current date!
moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))

function mockTodaySubtract(days) {
  return moment().subtract(days, 'day').format('YYYY-MM-DD')
}

describe('getRecategoriseOffenders', () => {
  beforeEach(() => {
    const sentenceDates = [
      { bookingId: 123, releaseDate: '2019-04-21' },
      { bookingId: 122, releaseDate: '2020-11-30' },
      { bookingId: 121, releaseDate: '2019-04-18' },
    ]
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
  })

  test('it should return a list of offenders and sentence information', async () => {
    const dueData = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        category: 'B',
        nextReviewDate: '2019-04-20',
        assessStatus: 'A',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        category: 'C',
        nextReviewDate: '2019-05-21',
        assessStatus: 'A',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 122,
        category: 'D',
        nextReviewDate: '2019-06-22',
        assessStatus: 'A',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Soon',
        lastName: 'Released',
        bookingId: 121,
        category: 'D',
        nextReviewDate: '2019-04-19',
        assessStatus: 'A',
      },
    ]

    const u21Data = [
      {
        bookingId: 21,
        prisonerNumber: 'U2101AA',
        firstName: 'PETER',
        lastName: 'PAN',
        dateOfBirth: '1998-05-01',
        category: 'I',
      },
      {
        bookingId: 22,
        prisonerNumber: 'U2102AA',
        firstName: 'JUSTIN',
        lastName: 'BEIBER',
        dateOfBirth: '1998-06-01',
        category: 'J',
      },
      {
        bookingId: 23,
        prisonerNumber: 'U2103AA',
        firstName: 'SOMEONE',
        lastName: 'ELSE',
        dateOfBirth: '1998-06-01',
        category: 'B',
      },
    ]

    const u21CatData = [
      { bookingId: 21, assessStatus: 'A' },
      { bookingId: 22, assessStatus: 'A' },
      { bookingId: 23, assessStatus: 'A' },
    ]

    const expected = [
      {
        offenderNo: 'G12345',
        displayName: 'Brown, Jane',
        bookingId: 123,
        displayStatus: Status.SECURITY_MANUAL.value,
        nextReviewDateDisplay: '20/04/2019',
        reason: ReviewReason.DUE,
        overdue: true,
        buttonText: 'Edit',
        pom: 'Steve Rendell',
      },
      {
        offenderNo: 'U2101AA',
        displayName: 'Pan, Peter',
        bookingId: 21,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '01/05/2019',
        reason: ReviewReason.AGE,
        overdue: true,
        buttonText: 'Start',
      },
      {
        offenderNo: 'H12345',
        displayName: 'Doyle, Danny',
        bookingId: 111,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '21/05/2019',
        reason: ReviewReason.DUE,
        overdue: true,
        buttonText: 'Start',
      },
      {
        offenderNo: 'U2102AA',
        displayName: 'Beiber, Justin',
        bookingId: 22,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '01/06/2019',
        reason: ReviewReason.AGE,
        overdue: false,
        buttonText: 'Start',
      },
      {
        offenderNo: 'G55345',
        displayName: 'Allen, Alan',
        bookingId: 122,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '22/06/2019',
        reason: ReviewReason.DUE,
        overdue: false,
        buttonText: 'Start',
      },
      {
        bookingId: 555,
        buttonText: 'Edit',
        dbRecordExists: true,
        dbStatus: 'STARTED',
        displayName: 'Franks, Manual',
        displayStatus: 'Started',
        firstName: 'Manual',
        lastName: 'Franks',
        nextReviewDateDisplay: '11/02/2024',
        offenderNo: 'G88456',
        overdue: false,
        reason: ReviewReason.MANUAL,
      },
    ]
    nomisClient.getRecategoriseOffenders.mockResolvedValue(dueData)
    prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)
    // looking for any manually started cats to add them in
    formService.getCategorisationRecords.mockResolvedValue([
      { bookingId: 555, offenderNo: 'G55345', status: Status.STARTED.name },
    ])
    nomisClient.getOffenderDetails.mockResolvedValue({
      bookingId: 555,
      offenderNo: 'G88456',
      firstName: 'Manual',
      lastName: 'Franks',
      assessments: [
        {
          assessmentCode: 'CATEGORY',
          assessmentStatus: 'A',
          bookingId: 555,
          nextReviewDate: '2024-02-11T00:00:00.000+00:00',
        },
      ],
    })
    formService.getCategorisationRecord.mockImplementation(bookingId => {
      switch (bookingId) {
        case 22:
          return { bookingId, status: Status.APPROVED.name, reviewReason: 'MANUAL' }
        case 122:
          return { bookingId, status: Status.APPROVED.name, reviewReason: 'MANUAL' }
        case 123:
          return { bookingId, status: Status.SECURITY_MANUAL.name }
        case 555:
          return { bookingId, status: Status.STARTED.name, reviewReason: 'MANUAL' }
        default:
          return {}
      }
    })

    const result = await service.getRecategoriseOffenders(context, 'user1')

    expect(nomisClient.getRecategoriseOffenders.mock.calls[0][0]).toEqual('LEI')
    expect(prisonerSearchClient.getPrisonersAtLocation).toBeCalled()
    expect(nomisClient.getOffenderDetails).toBeCalled()
    expect(formService.getCategorisationRecord).toBeCalledTimes(7) // includes omitted 'Soon released'
    expect(result).toMatchObject(expected)
  })

  test('it should filter out duplicates from the manually started recats', async () => {
    const dueData = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        category: 'B',
        nextReviewDate: '2019-04-20',
        assessStatus: 'A',
      },
    ]

    const expected = [
      {
        offenderNo: 'G12345',
        displayName: 'Brown, Jane',
        bookingId: 123,
        displayStatus: Status.SECURITY_MANUAL.value,
        nextReviewDateDisplay: '20/04/2019',
        reason: ReviewReason.DUE,
        overdue: true,
        buttonText: 'Edit',
      },
    ]
    nomisClient.getRecategoriseOffenders.mockResolvedValue(dueData)
    prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue([])
    // looking for any manually started cats to add them in - finds one that is already in the recat list
    formService.getCategorisationRecords.mockResolvedValue([
      { bookingId: 123, offenderNo: 'G55345', status: Status.STARTED.name },
    ])

    formService.getCategorisationRecord.mockResolvedValue({ bookingId: 123, status: Status.SECURITY_MANUAL.name })

    const result = await service.getRecategoriseOffenders(context, 'user1')

    expect(nomisClient.getOffenderDetails).not.toBeCalled()
    expect(formService.getCategorisationRecord).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should filter out any duplicates from young and standard offender recat lists', async () => {
    const dueData = [
      {
        offenderNo: 'G12345',
        firstName: 'PETER',
        lastName: 'PAN',
        bookingId: 123,
        category: 'C',
        nextReviewDate: '2019-04-20',
        assessStatus: 'P',
      },
    ]

    const u21Data = [
      {
        bookingId: 123,
        prisonerNumber: 'G12345',
        firstName: 'PETER',
        lastName: 'PAN',
        dateOfBirth: '1998-05-01',
        category: 'I',
      },
    ]

    const u21CatData = [{ bookingId: 123, assessStatus: 'P' }]

    const expected = [
      {
        offenderNo: 'G12345',
        displayName: 'Pan, Peter',
        bookingId: 123,
        displayStatus: 'Awaiting approval',
        nextReviewDateDisplay: '01/05/2019',
        reason: ReviewReason.AGE,
        overdue: true,
        buttonText: 'View',
      },
    ]
    nomisClient.getRecategoriseOffenders.mockResolvedValue(dueData)
    prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)
    // no manually started recats
    formService.getCategorisationRecords.mockResolvedValue([])
    formService.getCategorisationRecord.mockResolvedValue({ bookingId: 123, status: Status.AWAITING_APPROVAL.name })

    const result = await service.getRecategoriseOffenders(context, 'user1')

    expect(nomisClient.getRecategoriseOffenders.mock.calls[0][0]).toEqual('LEI')
    expect(prisonerSearchClient.getPrisonersAtLocation).toBeCalled()
    expect(formService.getCategorisationRecord).toBeCalledTimes(2)
    expect(result).toMatchObject(expected)
  })

  test('No results from elite', async () => {
    nomisClient.getRecategoriseOffenders.mockResolvedValue([])
    prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue([])
    formService.getCategorisationRecords.mockResolvedValue([])

    const result = await service.getRecategoriseOffenders(context, 'user1')
    expect(result).toHaveLength(0)
  })

  test('No results due to INITIAL', async () => {
    const data = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        category: 'B',
        nextReviewDate: '2019-04-20',
      },
    ]
    const u21Data = [
      {
        bookingId: 21,
        prisonerNumber: 'U2101AA',
        firstName: 'PETER',
        lastName: 'PAN',
        dateOfBirth: '1998-05-01',
        category: 'I',
      },
    ]

    const u21CatData = [
      {
        offenderNo: 'G12345',
        bookingId: 21,
        assessStatus: 'A',
      },
    ]
    formService.getCategorisationRecord
      .mockResolvedValueOnce({
        bookingId: 123,
        status: Status.SECURITY_BACK.name,
        catType: 'INITIAL',
      })
      .mockResolvedValueOnce({
        bookingId: 21,
        status: Status.STARTED.name,
        catType: 'INITIAL',
      })
    nomisClient.getRecategoriseOffenders.mockResolvedValue(data)
    prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)
    formService.getCategorisationRecords.mockResolvedValue([])

    const result = await service.getRecategoriseOffenders(context, 'user1')

    expect(result).toHaveLength(0)
    expect(formService.getCategorisationRecord).toBeCalledTimes(2)
  })

  test('No results due to legal status remand when withSi1481Changes is true', async () => {
    const data = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        category: 'B',
        nextReviewDate: '2019-04-20',
      },
    ]
    const prisonerSearchData = [
      {
        bookingId: 123,
        legalStatus: LEGAL_STATUS_REMAND,
      },
    ]
    formService.getCategorisationRecord.mockResolvedValue(null)
    prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue([])
    formService.getCategorisationRecords.mockResolvedValue([])
    nomisClient.getRecategoriseOffenders.mockResolvedValue(data)
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(prisonerSearchData)

    const result = await service.getRecategoriseOffenders(context, 'user1', {}, true)

    expect(result).toHaveLength(0)
  })

  test('Shows remand results when withSi1481Changes is false', async () => {
    const data = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        category: 'B',
        nextReviewDate: '2019-04-20',
      },
    ]
    const prisonerSearchData = [
      {
        bookingId: 123,
        legalStatus: LEGAL_STATUS_REMAND,
      },
    ]
    formService.getCategorisationRecord.mockResolvedValue(null)
    prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue([])
    formService.getCategorisationRecords.mockResolvedValue([])
    nomisClient.getRecategoriseOffenders.mockResolvedValue(data)
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(prisonerSearchData)

    const result = await service.getRecategoriseOffenders(context, 'user1', {}, false)

    expect(result).toHaveLength(1)
  })
})

describe('getUnapprovedOffenders', () => {
  test('it should return a list of offenders and sentence information', async () => {
    const data = [
      {
        offenderNo: 'G0001',
        firstName: 'JANE',
        lastName: 'BROWN',
        bookingId: 1,
        category: 'B',
        categoriserFirstName: 'CATTER',
        categoriserLastName: 'ONE',
        nextReviewDate: '2020-04-20',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 11,
      },
      {
        offenderNo: 'G0002',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 2,
        category: 'C',
        categoriserFirstName: 'Catter',
        categoriserLastName: 'Two',
        nextReviewDate: '2019-05-21',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 12,
      },
      {
        offenderNo: 'G0003',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 3,
        category: 'D',
        categoriserFirstName: 'Catter',
        categoriserLastName: 'Three',
        nextReviewDate: '2019-05-22',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 13,
      },
      {
        offenderNo: 'G0004',
        firstName: 'Steve',
        lastName: 'Coogan',
        bookingId: 4,
        category: 'C',
        nextReviewDate: '2019-05-22',
        status: 'UNCATEGORISED',
      },
      {
        offenderNo: 'G0005',
        firstName: 'Supervisor',
        lastName: 'Back',
        bookingId: 5,
        category: 'C',
        nextReviewDate: '2019-05-22',
        status: 'AWAITING_APPROVAL',
      },
      {
        offenderNo: 'G0006',
        firstName: 'Notin',
        lastName: 'Database',
        categoriserFirstName: 'CATTER',
        categoriserLastName: 'SIX',
        bookingId: 6,
        category: 'C',
        nextReviewDate: '2019-05-25',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 16,
      },
      {
        offenderNo: 'G0007',
        firstName: 'DIFFERENT',
        lastName: 'SEQUENCES',
        categoriserFirstName: 'CATTER',
        categoriserLastName: 'SEVEN',
        bookingId: 7,
        category: 'C',
        nextReviewDate: '2019-05-29',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 99,
      },
      {
        offenderNo: 'G0008',
        firstName: 'WRONG',
        lastName: 'STATUS',
        categoriserFirstName: 'CATTER',
        categoriserLastName: 'EIGHT',
        bookingId: 8,
        category: 'C',
        nextReviewDate: '2019-05-29',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 99,
      },
      {
        offenderNo: 'G0009',
        firstName: 'WRONG',
        lastName: 'STATUS',
        categoriserFirstName: 'CATTER',
        categoriserLastName: 'NINE',
        bookingId: 9,
        category: 'C',
        nextReviewDate: '2019-05-29',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 99,
      },
      {
        offenderNo: 'G0010',
        firstName: 'IN',
        lastName: 'OTHER_CATEGORIES',
        categoriserFirstName: 'CATTER',
        categoriserLastName: 'TEN',
        bookingId: 10,
        category: 'C',
        nextReviewDate: '2019-05-29',
        status: 'AWAITING_APPROVAL',
        assessmentSeq: 99,
      },
    ]

    nomisClient.getUncategorisedOffenders.mockResolvedValue(data)
    formService.getUnapprovedLite.mockResolvedValue([{ bookingId: 10 }])

    formService.getCategorisationRecord
      .mockResolvedValueOnce({ bookingId: 1, nomisSeq: 11, catType: 'INITIAL', status: Status.AWAITING_APPROVAL.name })
      .mockResolvedValueOnce({ bookingId: 2, nomisSeq: 12, catType: 'RECAT', status: Status.APPROVED.name })
      .mockResolvedValueOnce({ bookingId: 3, nomisSeq: 13, catType: 'RECAT', status: Status.AWAITING_APPROVAL.name })
      .mockResolvedValueOnce({ bookingId: 5, nomisSeq: 15, catType: 'RECAT', status: Status.SUPERVISOR_BACK.name })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ bookingId: 7, nomisSeq: 17, catType: 'RECAT', status: Status.AWAITING_APPROVAL.name })
      .mockResolvedValueOnce({ bookingId: 8, nomisSeq: 18, catType: 'RECAT', status: Status.SECURITY_BACK.name })
      .mockResolvedValueOnce({ bookingId: 9, nomisSeq: 19, catType: 'RECAT', status: Status.SECURITY_MANUAL.name })
      .mockResolvedValueOnce({ bookingId: 10, nomisSeq: 1, catType: 'RECAT', status: Status.AWAITING_APPROVAL.name })

    const sentenceDates = [
      { bookingId: 1, sentenceStartDate: mockTodaySubtract(30) }, // 2019-05-01
      { bookingId: 6, sentenceStartDate: mockTodaySubtract(18) }, // 2019-05-13
    ]
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)

    const expected = [
      {
        offenderNo: 'G0001',
        displayName: 'Brown, Jane',
        categoriserDisplayName: 'Catter One',
        bookingId: 1,
        dbRecordExists: true,
        catType: 'Initial',
        pnomis: false,
        dateRequired: '15/05/2019',
        daysSinceSentence: 30,
        sentenceDate: '2019-05-01',
      },
      {
        offenderNo: 'G0002',
        displayName: 'Doyle, Danny',
        categoriserDisplayName: 'Catter Two',
        bookingId: 2,
        dbRecordExists: true,
        catType: 'Recat',
        pnomis: true,
        nextReviewDate: '21/05/2019',
      },
      {
        offenderNo: 'G0003',
        displayName: 'Allen, Alan',
        categoriserDisplayName: 'Catter Three',
        bookingId: 3,
        dbRecordExists: true,
        catType: 'Recat',
        pnomis: false,
        nextReviewDate: '22/05/2019',
      },
      {
        offenderNo: 'G0006',
        displayName: 'Database, Notin',
        categoriserDisplayName: 'Catter Six',
        catType: '',
        bookingId: 6,
        dbRecordExists: false,
        pnomis: true,
        nextReviewDate: '25/05/2019',
        dateRequired: '27/05/2019',
        daysSinceSentence: 18,
        sentenceDate: '2019-05-13',
      },
      {
        offenderNo: 'G0007',
        displayName: 'Sequences, Different',
        categoriserDisplayName: 'Catter Seven',
        catType: 'Recat',
        bookingId: 7,
        dbRecordExists: true,
        pnomis: true,
        nextReviewDate: '29/05/2019',
      },
    ]

    const result = await service.getUnapprovedOffenders(context, mockTransactionalClient)

    expect(nomisClient.getUncategorisedOffenders.mock.calls[0][0]).toEqual('LEI')
    expect(formService.getCategorisationRecord).toBeCalledTimes(9)
    expect(formService.getCategorisationRecord).nthCalledWith(1, 1, mockTransactionalClient)
    expect(prisonerSearchClient.getPrisonersByBookingIds).toBeCalledWith([1, 6])
    expect(result).toMatchObject(expected)
  })

  test('No results from elite', async () => {
    nomisClient.getUncategorisedOffenders.mockResolvedValue([])
    formService.getUnapprovedLite.mockResolvedValue([])
    const result = await service.getUnapprovedOffenders(context, 'LEI', mockTransactionalClient)
    expect(result).toHaveLength(0)
  })
})

describe('getUncategorisedOffenders', () => {
  test('it should return a list of offenders and sentence information', async () => {
    const uncategorised = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        status: Status.UNCATEGORISED.name,
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 122,
        status: Status.AWAITING_APPROVAL.name,
      },
    ]

    const sentenceDates = [
      { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) },
      { bookingId: 122, sentenceStartDate: mockTodaySubtract(10) },
    ]

    const expected = [
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        displayName: 'Allen, Alan',
        bookingId: 122,
        status: Status.AWAITING_APPROVAL.name,
        displayStatus: Status.AWAITING_APPROVAL.value,
        sentenceDate: '2019-05-21',
        daysSinceSentence: 10,
        dateRequired: '04/06/2019',
        pom: 'Steve Rendell',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        displayName: 'Doyle, Danny',
        bookingId: 111,
        status: Status.UNCATEGORISED.name,
        displayStatus: Status.UNCATEGORISED.value,
        sentenceDate: '2019-05-24',
        daysSinceSentence: 7,
        dateRequired: '07/06/2019',
      },
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        displayName: 'Brown, Jane',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
        displayStatus: Status.UNCATEGORISED.value,
        sentenceDate: '2019-05-27',
        daysSinceSentence: 4,
        dateRequired: '10/06/2019',
      },
    ]

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue({})

    const result = await service.getUncategorisedOffenders(context, 'user1')

    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(prisonerSearchClient.getPrisonersByBookingIds).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle an empty response', async () => {
    const uncategorised = []
    const expected = []

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)

    const result = await service.getUncategorisedOffenders(context, 'user1')
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })

  test('it should calculate business days correctly', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-01-16', 'YYYY-MM-DD'))
    expect(service.buildSentenceData('2019-01-14')).toEqual({
      daysSinceSentence: 2,
      dateRequired: '28/01/2019',
      sentenceDate: '2019-01-14',
      overdue: false,
      overdueText: '',
    })
  })

  test('it should calculate business days correctly when sentenceDate is Saturday', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-01-16', 'YYYY-MM-DD'))
    expect(service.buildSentenceData('2019-01-12')).toEqual({
      daysSinceSentence: 4,
      dateRequired: '28/01/2019',
      sentenceDate: '2019-01-12',
      overdue: false,
      overdueText: '',
    })
  })

  test('it should calculate business days correctly when sentenceDate is Sunday', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-01-16', 'YYYY-MM-DD'))
    expect(service.buildSentenceData('2019-01-13')).toEqual({
      daysSinceSentence: 3,
      dateRequired: '28/01/2019',
      sentenceDate: '2019-01-13',
      overdue: false,
      overdueText: '',
    })
  })

  test('it should detect overdue record', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-01-29', 'YYYY-MM-DD'))
    expect(service.buildSentenceData('2019-01-14')).toEqual({
      daysSinceSentence: 15,
      dateRequired: '28/01/2019',
      sentenceDate: '2019-01-14',
      overdue: true,
      overdueText: '1 day',
    })
  })

  test('it should not return offenders without sentence data', async () => {
    const uncategorised = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
      },
    ]

    const sentenceDates = [{ bookingId: 123 }]

    const expected = []

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue({})

    const result = await service.getUncategorisedOffenders(context, 'user1')
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })

  test('it should propagate an error response', async () => {
    nomisClient.getUncategorisedOffenders.mockRejectedValue(new Error('test'))
    try {
      await service.getUncategorisedOffenders(context, 'MDI')
      expect(service.shouldNotReachHere) // service will rethrow error
    } catch (error) {
      expect(error.message).toEqual('test')
    }
  })

  test('it returns a pnomis marker for inconsistent data', async () => {
    const uncategorised = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
      },
    ]

    const dbRecord = { bookingId: 1, nomisSeq: 11, catType: 'INITIAL', status: Status.AWAITING_APPROVAL.name }

    const sentenceDates = [{ bookingId: 123, sentenceStartDate: mockTodaySubtract(4) }]
    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue(dbRecord)

    const result = await service.getUncategorisedOffenders(context, 'user1')
    expect(result[0].pnomis).toBe('PNOMIS')
  })

  test('it filters out IS91s', async () => {
    const uncategorised = [
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        status: Status.UNCATEGORISED.name,
      },
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
      },
    ]

    // const dbRecord = { bookingId: 1, nomisSeq: 11, catType: 'INITIAL', status: Status.AWAITING_APPROVAL.name }

    const sentenceDates = [
      { bookingId: 123, sentenceStartDate: mockTodaySubtract(4), mostSeriousOffence: 'EMBEZZLEMENT' },
      { bookingId: 111, sentenceStartDate: mockTodaySubtract(4), mostSeriousOffence: 'ILLEGAL IMMIGRANT/DETAINEE' },
    ]

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)

    const results = await service.getUncategorisedOffenders(context, 'user1')
    expect(results).toHaveLength(1)
    expect(results[0].bookingId).toEqual(123)
  })

  test('it filters out non overdue when the overdue filter is set', async () => {
    const uncategorised = [
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        status: Status.UNCATEGORISED.name,
        nextReviewDate: '2019-01-30',
      },
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
        nextReviewDate: '2019-01-28',
      },
    ]

    const sentenceDates = [
      { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) },
    ]

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)

    const results = await service.getUncategorisedOffenders(context, 'user1', { [DUE_DATE]: [OVERDUE] })
    expect(results).toHaveLength(1)
    expect(results).toEqual([
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        displayName: 'Brown, Jane',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
        displayStatus: Status.UNCATEGORISED.value,
        daysSinceSentence: 4,
        dateRequired: '08/02/2019',
        nextReviewDate: '2019-01-28',
        overdue: false,
        overdueText: '',
        pnomis: false,
        pom: 'Steve Rendell',
        securityReferred: false,
        sentenceDate: '2019-01-25',
      },
    ])
  })

  test('it includes manual cats in progress', async () => {
    const uncategorised = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
      },
    ]

    const sentenceDates = [
      { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      // {  bookingId: 111, sentenceStartDate: mockTodaySubtract(7)  },
    ]

    const expected = [
      {
        offenderNo: 'G55345',
        firstName: 'Manual',
        lastName: 'Guy',
        displayName: 'Guy, Manual',
        bookingId: 111,
        displayStatus: Status.STARTED.value,
      },
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        displayName: 'Brown, Jane',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
        displayStatus: Status.UNCATEGORISED.value,
        sentenceDate: '2019-01-25',
        daysSinceSentence: 4,
        dateRequired: '08/02/2019',
      },
    ]

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    formService.getCategorisationRecords.mockResolvedValue([
      { bookingId: 111, offenderNo: 'G55345', status: Status.STARTED.name },
    ])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue({})
    nomisClient.getBasicOffenderDetails.mockResolvedValue({
      bookingId: 111,
      offenderNo: 'G55345',
      firstName: 'Manual',
      lastName: 'Guy',
    })

    const result = await service.getUncategorisedOffenders(context, 'user1')

    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(prisonerSearchClient.getPrisonersByBookingIds).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('only flags security referred with NEW status', async () => {
    const expected = [
      {
        offenderNo: 'G12346',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: 'UNCATEGORISED',
        displayName: 'Brown, Jane',
        daysSinceSentence: 7,
        dateRequired: expect.anything(),
        sentenceDate: expect.anything(),
        overdue: false,
        displayStatus: 'Not categorised',
        pnomis: false,
        securityReferred: false,
      },
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 111,
        status: 'UNCATEGORISED',
        displayName: 'Brown, Jane',
        daysSinceSentence: 4,
        dateRequired: expect.anything(),
        sentenceDate: expect.anything(),
        overdue: false,
        displayStatus: 'Not categorised',
        pnomis: false,
        securityReferred: true,
      },
    ]

    const uncategorised = [
      {
        offenderNo: 'G12346',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: 'UNCATEGORISED',
        displayName: 'Brown, Jane',
        daysSinceSentence: 7,
        dateRequired: '07/06/2019',
        sentenceDate: '2019-05-24',
        overdue: false,
        displayStatus: 'Not categorised',
        pnomis: false,
        securityReferred: false,
      },
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 111,
        status: 'UNCATEGORISED',
        displayName: 'Brown, Jane',
        daysSinceSentence: 4,
        dateRequired: '10/06/2019',
        sentenceDate: '2019-05-27',
        overdue: false,
        displayStatus: 'Not categorised',
        pnomis: false,
        securityReferred: true,
      },
    ]

    const sentenceDates = [
      { bookingId: 111, sentenceStartDate: mockTodaySubtract(4) },
      { bookingId: 123, sentenceStartDate: mockTodaySubtract(7) },
    ]

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue({})
    formService.getSecurityReferrals.mockResolvedValue([
      { offenderNo: 'G12345', status: 'NEW' },
      { offenderNo: 'G12346', status: 'NOT NEW' },
    ])

    const result = await service.getUncategorisedOffenders(context, 'user1')

    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(prisonerSearchClient.getPrisonersByBookingIds).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  describe('getUncategorisedOffenders calculates inconsistent data correctly', () => {
    test.each`
      nomisStatus                      | localStatus                      | pnomis
      ${Status.UNCATEGORISED.name}     | ${Status.SUPERVISOR_BACK.name}   | ${false}
      ${Status.UNCATEGORISED.name}     | ${Status.SECURITY_BACK.name}     | ${false}
      ${Status.UNCATEGORISED.name}     | ${Status.AWAITING_APPROVAL.name} | ${'PNOMIS'}
      ${Status.AWAITING_APPROVAL.name} | ${Status.SECURITY_BACK.name}     | ${false}
      ${Status.AWAITING_APPROVAL.name} | ${Status.SECURITY_MANUAL.name}   | ${false}
      ${Status.AWAITING_APPROVAL.name} | ${Status.SUPERVISOR_BACK.name}   | ${false}
      ${Status.AWAITING_APPROVAL.name} | ${Status.STARTED.name}           | ${'PNOMIS'}
    `('should return pnomis $pnomis for localStatus $localStatus', async ({ nomisStatus, localStatus, pnomis }) => {
      const uncategorised = [
        {
          offenderNo: 'G12345',
          firstName: 'Jane',
          lastName: 'Brown',
          bookingId: 123,
          status: nomisStatus,
        },
      ]

      const dbRecord = { bookingId: 1, nomisSeq: 11, catType: 'INITIAL', status: localStatus }

      const sentenceDates = [{ bookingId: 123, sentenceStartDate: mockTodaySubtract(4) }]
      nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
      formService.getCategorisationRecords.mockResolvedValue([])
      prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
      formService.getCategorisationRecord.mockResolvedValue(dbRecord)
      const result = await service.getUncategorisedOffenders(context, 'user1')
      expect(result[0].pnomis).toBe(pnomis)
    })
  })
})

describe('createOrUpdateCategorisation', () => {
  test('create', async () => {
    nomisClient.createCategorisation.mockResolvedValue({ sequenceNumber: 9 })

    const bookingId = 15
    const overriddenCategory = 'B'
    const suggestedCategory = 'C'
    const overriddenCategoryText = 'some text'
    const nextReviewDate = '14/11/2020'

    await service.createOrUpdateCategorisation({
      context,
      bookingId,
      overriddenCategory,
      suggestedCategory,
      overriddenCategoryText,
      nextReviewDate,
      transactionalDbClient: mockTransactionalClient,
    })

    expect(nomisClient.createCategorisation).toBeCalledWith({
      bookingId,
      category: overriddenCategory,
      committee: 'OCA',
      comment: overriddenCategoryText,
      nextReviewDate: '2020-11-14',
    })
    expect(formService.recordNomisSeqNumber).toBeCalledWith(bookingId, 9, mockTransactionalClient)
  })

  test('update', async () => {
    const bookingId = 15
    const overriddenCategory = ''
    const suggestedCategory = 'C'
    const overriddenCategoryText = 'some text'
    const nextReviewDate = '14/11/2020'
    const nomisSeq = 8

    await service.createOrUpdateCategorisation({
      context,
      bookingId,
      overriddenCategory,
      suggestedCategory,
      overriddenCategoryText,
      nextReviewDate,
      nomisSeq,
      transactionalDbClient: mockTransactionalClient,
    })

    expect(nomisClient.updateCategorisation).toBeCalledWith({
      bookingId,
      assessmentSeq: nomisSeq,
      category: suggestedCategory,
      committee: 'OCA',
      comment: overriddenCategoryText,
      nextReviewDate: '2020-11-14',
    })
  })

  test('should propagate error response', async () => {
    nomisClient.createCategorisation.mockRejectedValue(new Error('our Error'))

    try {
      await service.createOrUpdateCategorisation({ context, bookingId: 12 })
    } catch (s) {
      expect(s.message).toEqual('our Error')
    }
  })
})

describe('Lite', () => {
  test('createLiteCategorisation', async () => {
    nomisClient.createCategorisation.mockResolvedValue({ sequenceNumber: 9 })

    const bookingId = 15
    await service.createLiteCategorisation({
      context,
      bookingId,
      category: 'B',
      authority: 'GOV',
      nextReviewDate: '14/03/2020',
      placement: 'BXI',
      comment: 'a comment',
      offenderNo: 'B0003TT',
      prisonId: 'LEI',
      transactionalClient: mockTransactionalClient,
    })

    expect(nomisClient.createCategorisation).toBeCalledWith({
      bookingId,
      category: 'B',
      committee: 'GOV',
      comment: 'a comment',
      nextReviewDate: '2020-03-14',
      placementAgencyId: 'BXI',
    })
    expect(formService.recordLiteCategorisation).toBeCalledWith({
      context,
      bookingId,
      sequence: 9,
      category: 'B',
      offenderNo: 'B0003TT',
      prisonId: 'LEI',
      assessmentCommittee: 'GOV',
      assessmentComment: 'a comment',
      nextReviewDate: '2020-03-14',
      placementPrisonId: 'BXI',
      transactionalClient: mockTransactionalClient,
    })
  })

  test('approveLiteCategorisation', async () => {
    formService.approveLiteCategorisation.mockResolvedValue({})
    nomisClient.createSupervisorApproval.mockResolvedValue({})

    const bookingId = 14
    await service.approveLiteCategorisation({
      context,
      bookingId,
      sequence: 6,
      approvedDate: '15/04/2020',
      supervisorCategory: 'E',
      approvedCategoryComment: 'approvedCategoryComment',
      approvedCommittee: 'SECUR',
      nextReviewDate: '14/03/2020',
      approvedPlacement: 'BMI',
      approvedPlacementComment: 'approvedPlacementComment',
      approvedComment: 'approvedComment',
      transactionalClient: mockTransactionalClient,
    })

    expect(formService.approveLiteCategorisation).toBeCalledWith({
      context,
      bookingId,
      sequence: 6,
      approvedDate: '2020-04-15',
      supervisorCategory: 'E',
      // approvedCategoryComment: 'approvedCategoryComment',
      approvedCommittee: 'SECUR',
      nextReviewDate: '2020-03-14',
      approvedPlacement: 'BMI',
      approvedPlacementComment: 'approvedPlacementComment',
      approvedComment: 'approvedComment',
      approvedCategoryComment: 'approvedCategoryComment',
      transactionalClient: mockTransactionalClient,
    })
    expect(nomisClient.createSupervisorApproval).toBeCalledWith({
      bookingId,
      assessmentSeq: 6,
      category: 'E',
      approvedCategoryComment: 'approvedCategoryComment',
      reviewCommitteeCode: 'SECUR',
      nextReviewDate: '2020-03-14',
      approvedPlacementAgencyId: 'BMI',
      approvedPlacementText: 'approvedPlacementComment',
      evaluationDate: '2020-04-15',
      committeeCommentText: 'approvedComment',
    })
  })

  test('getUnapprovedLite', async () => {
    formService.getUnapprovedLite.mockResolvedValue([
      {
        bookingId: 111,
        sequence: 11,
        category: 'E',
        offenderNo: 'G12345',
        createdDate: '2019-01-01',
        assessedBy: 'JSMITH',
      },
      {
        bookingId: 222,
        sequence: 12,
        category: 'H',
        offenderNo: 'H12345',
        createdDate: '2019-01-02',
        assessedBy: 'JSMITH',
      },
      {
        bookingId: 333,
        sequence: 13,
        category: 'A',
        offenderNo: 'G55345',
        createdDate: '2019-01-03',
        assessedBy: 'BMAY',
      },
      {
        bookingId: 444,
        sequence: 14,
        category: 'E',
        offenderNo: 'G0001',
        createdDate: '2019-01-01',
        assessedBy: 'Unknown',
      },
    ])

    nomisClient.getOffenderDetailList.mockResolvedValue([
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 111,
        status: Status.UNCATEGORISED.name,
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 222,
        status: Status.UNCATEGORISED.name,
      },
    ])

    nomisClient.getUserDetailList.mockResolvedValue([
      {
        username: 'JSMITH',
        firstName: 'John',
        lastName: 'Smith',
      },
      {
        username: 'BMAY',
        firstName: 'Brian',
        lastName: 'May',
      },
    ])

    const sentenceDates = [
      { bookingId: 111, status: 'ACTIVE IN' },
      { bookingId: 222, status: 'ACTIVE IN' },
      { bookingId: 333, status: 'ACTIVE IN' },
      { bookingId: 444, status: 'ACTIVE IN' },
    ]
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)

    const data = await service.getUnapprovedLite(context, mockTransactionalClient)

    expect(data).toEqual([
      {
        assessedBy: 'JSMITH',
        assessedDate: '01/01/2019',
        bookingId: 111,
        categoriserDisplayName: 'John Smith',
        category: 'E',
        createdDate: '2019-01-01',
        displayName: 'Brown, Jane',
        offenderNo: 'G12345',
        sequence: 11,
      },
      {
        assessedBy: 'JSMITH',
        assessedDate: '02/01/2019',
        bookingId: 222,
        categoriserDisplayName: 'John Smith',
        category: 'H',
        createdDate: '2019-01-02',
        displayName: 'Doyle, Danny',
        offenderNo: 'H12345',
        sequence: 12,
      },
      {
        assessedBy: 'BMAY',
        assessedDate: '03/01/2019',
        bookingId: 333,
        categoriserDisplayName: 'Brian May',
        category: 'A',
        createdDate: '2019-01-03',
        offenderNo: 'G55345',
        sequence: 13,
      },
      {
        assessedBy: 'Unknown',
        assessedDate: '01/01/2019',
        bookingId: 444,
        categoriserDisplayName: 'Unknown',
        category: 'E',
        createdDate: '2019-01-01',
        offenderNo: 'G0001',
        sequence: 14,
      },
    ])
  })
})

test('createSupervisorApproval should propagate error response', async () => {
  nomisClient.createSupervisorApproval.mockRejectedValue(new Error('our Error'))
  try {
    await service.createSupervisorApproval(context, 12, {})
  } catch (s) {
    expect(s.message).toEqual('our Error')
  }
})

describe('getReferredOffenders', () => {
  const offenderDetailList = [
    {
      offenderNo: 'G12345',
      firstName: 'Jane',
      lastName: 'Brown',
      bookingId: 123,
      status: Status.UNCATEGORISED.name,
    },
    {
      offenderNo: 'H12345',
      firstName: 'Danny',
      lastName: 'Doyle',
      bookingId: 111,
      status: Status.UNCATEGORISED.name,
    },
    {
      offenderNo: 'G55345',
      firstName: 'Alan',
      lastName: 'Allen',
      bookingId: 122,
      status: Status.UNCATEGORISED.name,
    },
    {
      offenderNo: 'A1000AA',
      firstName: 'Peter',
      lastName: 'Purves',
      bookingId: 135,
      status: Status.UNCATEGORISED.name,
    },
    {
      offenderNo: 'A1000AB',
      firstName: 'JOHN',
      lastName: 'NOAKES',
      bookingId: 137,
      status: Status.UNCATEGORISED.name,
    },
  ]
  const userDetailsList = [
    {
      username: 'JSMITH',
      firstName: 'John',
      lastName: 'Smith',
    },
    {
      username: 'BMAY',
      firstName: 'Brian',
      lastName: 'May',
    },
  ]

  const securityReferredOffenders = [
    {
      id: -1,
      bookingId: 123,
      offenderNo: 'G12345',
      userId: 'me',
      status: Status.SECURITY_AUTO.name,
      formObject: '',
      // assigned_user_id not present
      securityReferredDate: '2019-02-04',
      securityReferredBy: 'JSMITH',
      catType: 'INITIAL',
    },
    {
      id: -3,
      bookingId: 122,
      offenderNo: 'G55345',
      userId: 'me',
      status: Status.SECURITY_MANUAL.name,
      formObject: { security: { review: { securityReview: 'security info' } } },
      securityReferredDate: '2019-02-04',
      securityReferredBy: 'BMAY',
      catType: 'INITIAL',
    },
    {
      id: -5,
      bookingId: 135,
      offenderNo: 'A1000AA',
      userId: 'me',
      status: Status.SECURITY_FLAGGED.name,
      formObject: '',
      securityReferredDate: '2019-02-04',
      securityReferredBy: 'BMAY',
      catType: 'RECAT',
    },
    {
      id: -7,
      bookingId: 137,
      offenderNo: 'A1000AB',
      userId: 'me',
      status: Status.SECURITY_MANUAL.name,
      formObject: '',
      securityReferredDate: '2019-02-04',
      securityReferredBy: 'BMAY',
      catType: 'RECAT',
    },
  ]

  test('it should return a list of offenders and sentence information', async () => {
    const sentenceDates = [
      { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) },
      { bookingId: 122, sentenceStartDate: mockTodaySubtract(10) },
    ]

    nomisClient.getOffenderDetailList.mockResolvedValue(offenderDetailList)
    nomisClient.getUserDetailList.mockResolvedValue(userDetailsList)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue([
      { bookingId: 135, nextReviewDate: '2020-09-20' },
      { bookingId: 137, nextReviewDate: '2020-09-30' },
      { bookingId: -99, nextReviewDate: '2011-09-30' },
    ])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)
    formService.getSecurityReferredOffenders.mockResolvedValue(securityReferredOffenders)

    const expected = [
      {
        offenderNo: 'G55345',
        displayName: 'Allen, Alan',
        bookingId: 122,
        daysSinceSentence: 10,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        securityReferredBy: 'Brian May',
        catTypeDisplay: 'Initial',
        buttonText: 'Edit',
      },
      {
        offenderNo: 'G12345',
        displayName: 'Brown, Jane',
        bookingId: 123,
        daysSinceSentence: 4,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        securityReferredBy: 'John Smith',
        catTypeDisplay: 'Initial',
        buttonText: 'Start',
      },
      {
        offenderNo: 'A1000AA',
        displayName: 'Purves, Peter',
        bookingId: 135,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        securityReferredBy: 'Brian May',
        catTypeDisplay: 'Recat',
        buttonText: 'Start',
      },
      {
        offenderNo: 'A1000AB',
        displayName: 'Noakes, John',
        bookingId: 137,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        securityReferredBy: 'Brian May',
        catTypeDisplay: 'Recat',
        buttonText: 'Start',
      },
    ]

    const result = await service.getReferredOffenders(context, mockTransactionalClient)

    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(prisonerSearchClient.getPrisonersByBookingIds).toBeCalledTimes(1)
    expect(nomisClient.getLatestCategorisationForOffenders).toBeCalledWith(['A1000AA', 'A1000AB'])
    expect(result).toMatchObject(expected)
  })

  test('it should return offenders without a sentence, as these can now be referred', async () => {
    const sentenceDates = [
      { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) },
    ]

    nomisClient.getOffenderDetailList.mockResolvedValue(offenderDetailList)
    nomisClient.getUserDetailList.mockResolvedValue(userDetailsList)
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue(sentenceDates)

    formService.getSecurityReferredOffenders.mockResolvedValue([
      {
        id: -1,
        bookingId: 123,
        offenderNo: 'G12345',
        userId: 'me',
        status: Status.SECURITY_AUTO.name,
        formObject: '',
        // assigned_user_id not present
        securityReferredDate: '2019-02-04',
        securityReferredBy: 'JSMITH',
        catType: 'INITIAL',
      },
      {
        id: -3,
        bookingId: 122,
        offenderNo: 'G55345',
        userId: 'me',
        status: Status.SECURITY_MANUAL.name,
        formObject: '',
        securityReferredDate: '2019-02-04',
        securityReferredBy: 'JSMITH',
        catType: 'INITIAL',
      },
    ])

    const expected = [
      {
        offenderNo: 'G55345',
        displayName: 'Allen, Alan',
        bookingId: 122,
        securityReferredBy: 'John Smith',
        catTypeDisplay: 'Initial',
      },
      {
        offenderNo: 'G12345',
        displayName: 'Brown, Jane',
        bookingId: 123,
        daysSinceSentence: 4,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        securityReferredBy: 'John Smith',
        catTypeDisplay: 'Initial',
      },
    ]

    const result = await service.getReferredOffenders(context, mockTransactionalClient)

    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(prisonerSearchClient.getPrisonersByBookingIds).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle an empty response', async () => {
    nomisClient.getUncategorisedOffenders.mockResolvedValue([])

    const result = await service.getReferredOffenders(context, mockTransactionalClient)
    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(result).toEqual([])
  })
})

describe('getOffenderDetails', () => {
  test('should assemble details correctly', async () => {
    const sentenceTerms = [{ years: 2, months: 4, lifeSentence: true }]
    nomisClient.getOffenderDetails.mockResolvedValue({ firstName: 'SAM', lastName: 'SMITH' })
    nomisClient.getSentenceDetails.mockResolvedValue({ dummyDetails: 'stuff' })
    nomisClient.getSentenceTerms.mockResolvedValue(sentenceTerms)
    nomisClient.getMainOffence.mockResolvedValue({ mainOffence: 'stuff' })

    const result = await service.getOffenderDetails(context, -5)

    expect(result).toEqual({
      sentence: { dummyDetails: 'stuff', list: sentenceTerms, indeterminate: true },
      offence: { mainOffence: 'stuff' },
      firstName: 'SAM',
      lastName: 'SMITH',
      displayName: 'Smith, Sam',
    })
  })
})

describe('requiredCatType', () => {
  const BOOKING_ID = 5
  const history = cat => [
    {
      bookingId: 5,
      classificationCode: cat,
    },
  ]

  'BCDIJTR'.split('').forEach(supportedCategory => {
    test(`when supported cat in nomis (Cat ${supportedCategory})`, () => {
      expect(service.requiredCatType(BOOKING_ID, supportedCategory, history(supportedCategory))).toBe('RECAT')
    })
  })

  test('when missing in nomis', () => {
    expect(service.requiredCatType(BOOKING_ID, null, [])).toBe('INITIAL')
  })

  test('when cat Z in nomis', () => {
    expect(service.requiredCatType(BOOKING_ID, 'Z', history('Z'))).toBe('INITIAL')
  })

  test('when cat A in nomis', () => {
    expect(service.requiredCatType(BOOKING_ID, 'A', history('A'))).toBe(null)
  })

  test('when cat U in nomis but there is an earlier cat', () => {
    expect(
      service.requiredCatType(BOOKING_ID, 'U', [
        {
          bookingId: 5,
          classificationCode: 'B',
        },
        {
          bookingId: 5,
          classificationCode: 'U',
        },
      ]),
    ).toBe('RECAT')
  })

  test('when cat U in nomis and there is no earlier cat', () => {
    expect(
      service.requiredCatType(BOOKING_ID, 'U', [
        {
          bookingId: 5,
          classificationCode: 'X',
        },
        {
          bookingId: 5,
          classificationCode: 'Z',
        },
        {
          bookingId: 5,
          classificationCode: 'U',
        },
      ]),
    ).toBe('INITIAL')
  })

  test('when cat U in nomis with earlier cat for different booking', () => {
    expect(
      service.requiredCatType(BOOKING_ID, 'U', [
        {
          bookingId: 99,
          classificationCode: 'B',
        },
        {
          bookingId: 5,
          classificationCode: 'U',
        },
      ]),
    ).toBe('INITIAL')
  })
})

describe('pnomisOrInconsistentWarning', () => {
  test('should return PNOMIS for nomis status is P but not locally FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'STARTED' }, 'P', false)
    expect(result.pnomis).toBe('PNOMIS')
    expect(result.requiresWarning).toBe(true)
  })

  test('should return PNOMIS for nomis status is A with local status AWAITING_APPROVAL FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'AWAITING_APPROVAL' }, 'A', false)
    expect(result.pnomis).toBe('PNOMIS')
    expect(result.requiresWarning).toBe(true)
  })

  test('should return false for nomis status is A with local status STARTED FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'STARTED' }, 'A', false)
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is A with local status SECURITY_AUTO FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SECURITY_AUTO' }, 'A', false)
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SUPERVISOR_BACK FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SUPERVISOR_BACK' }, 'P', false)
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SECURITY_BACK FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SECURITY_BACK' }, 'P', false)
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SECURITY_MANUAL FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SECURITY_MANUAL' }, 'P', false)
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SUPERVISOR_BACK FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SUPERVISOR_BACK' }, 'P', false)
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P (without warning) but not locally FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'APPROVED' }, 'A', false)
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return OTHER for other categorisation in progress', async () => {
    const result = service.pnomisOrInconsistentWarning({}, 'A', true)
    expect(result.pnomis).toBe('OTHER')
    expect(result.requiresWarning).toBe(false)
  })
})

describe('backToCategoriser', () => {
  test('happy path', async () => {
    const dbRecord = { nomisSeq: 6 }
    formService.backToCategoriser.mockResolvedValue(dbRecord)

    await service.backToCategoriser(context, 12, mockTransactionalClient)

    expect(formService.backToCategoriser).toBeCalledWith(12, mockTransactionalClient)
    const expectedDetails = {
      bookingId: 12,
      assessmentSeq: 6,
      evaluationDate: moment().format('YYYY-MM-DD'),
      reviewCommitteeCode: 'OCA',
      committeeCommentText: 'cat-tool rejected',
    }
    expect(nomisClient.createSupervisorRejection).toBeCalledWith(expectedDetails)
  })
})

describe('calculateButtonText', () => {
  test('should return Start ', async () => {
    const result = service.calculateButtonStatus({ status: 'STARTED' }, 'A')
    expect(result).toMatch('Edit')
  })

  test('should return View for nomis status is P but not locally', async () => {
    const result = service.calculateButtonStatus({ status: 'AWAITING_APPROVAL' }, 'P')
    expect(result).toMatch('View')
  })

  test('should return Edit for nomis status is A with local status AWAITING_APPROVAL', async () => {
    const result = service.calculateButtonStatus({ status: 'STARTED' }, 'A')
    expect(result).toMatch('Edit')
  })

  test('should return Edit for nomis status is A with local status SECURITY_AUTO', async () => {
    const result = service.calculateButtonStatus({ status: 'SECURITY_AUTO' }, 'A')
    expect(result).toMatch('Edit')
  })

  test('should return Edit for nomis status is A with local status SECURITY_MANUAL', async () => {
    const result = service.calculateButtonStatus({ status: 'SECURITY_MANUAL' }, 'A')
    expect(result).toMatch('Edit')
  })

  test('should return Edit for nomis status is P with local status SECURITY_BACK', async () => {
    const result = service.calculateButtonStatus({ status: 'SECURITY_BACK' }, 'P')
    expect(result).toMatch('Edit')
  })

  test('should return Edit for nomis status is P with local status SUPERVISOR_BACK', async () => {
    const result = service.calculateButtonStatus({ status: 'SUPERVISOR_BACK' }, 'P')
    expect(result).toMatch('Edit')
  })

  test('should return Edit for nomis status is P with local status SECURITY_MANUAL', async () => {
    const result = service.calculateButtonStatus({ status: 'SECURITY_MANUAL' }, 'P')
    expect(result).toMatch('Edit')
  })

  test('should return Start when nomis status is A but dbrecord does not exist', async () => {
    const result = service.calculateButtonStatus(null, 'A')
    expect(result).toMatch('Start')
  })

  test('should return Edit for nomis status is P with local status SUPERVISOR_BACK', async () => {
    const result = service.calculateButtonStatus({ status: 'SUPERVISOR_BACK' }, 'A')
    expect(result).toMatch('Edit')
  })

  test('should return Edit for nomis status is P with local status SECURITY_BACK', async () => {
    const result = service.calculateButtonStatus({ status: 'SECURITY_BACK' }, 'A')
    expect(result).toMatch('Edit')
  })
})

describe('getPrisonerBackground', () => {
  const cats = [
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2012-04-04',
      approvalDate: '2012-05-05',
      assessmentAgencyId: 'MDI',
      assessmentStatus: 'A',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2012-01-01',
      assessmentAgencyId: 'LEI',
      assessmentStatus: 'P',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2010-02-04',
      approvalDate: '2010-02-05',
      assessmentAgencyId: 'LEI',
      assessmentStatus: 'I',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'B',
      classification: 'Cat B',
      assessmentDate: '2013-03-24',
      approvalDate: '2013-03-28',
      assessmentAgencyId: 'MDI',
      assessmentStatus: 'I',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2018-04-04',
      assessmentAgencyId: 'LEI',
      assessmentStatus: 'I',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'B',
      classification: 'Cat B',
      assessmentDate: '2019-04-17',
      approvalDate: '2019-04-17',
      assessmentAgencyId: 'BXI',
      assessmentStatus: 'A',
    },
    // Records which are rejected by supervisors, then cancelled will have an approval
    // date even though they were never approved, it is the date they were rejected. They
    // should not be included.
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'B',
      classification: 'Cat B',
      assessmentDate: '2019-04-17',
      approvalDate: '2019-04-17',
      assessmentAgencyId: 'BXI',
      assessmentStatus: 'P',
    },
  ]

  test('it should return a list of historical categorisations, filtering out any pending, cancelled and future categorisations, sorted by approval date', async () => {
    nomisClient.getCategoryHistory.mockResolvedValue(cats)
    nomisClient.getAgencyDetail.mockResolvedValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2013-03-24',
        approvalDate: '2013-03-28',
        approvalDateDisplay: '28/03/2013',
        assessmentAgencyId: 'MDI',
        agencyDescription: 'Moorlands',
        assessmentStatus: 'I',
        classification: 'Cat B',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
        approvalDate: '2012-05-05',
        approvalDateDisplay: '05/05/2012',
        agencyDescription: 'Moorlands',
        assessmentAgencyId: 'MDI',
        assessmentStatus: 'A',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2010-02-04',
        approvalDate: '2010-02-05',
        approvalDateDisplay: '05/02/2010',
        assessmentAgencyId: 'LEI',
        assessmentStatus: 'I',
      },
    ]

    const result = await service.getPrisonerBackground(context, 'ABC1', moment('2019-04-16'))

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(2) // 1 for each unique agency
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should return a list of historical categorisations, filtering out any pending or cancelled categorisations, sorted by approval date', async () => {
    nomisClient.getCategoryHistory.mockResolvedValue(cats)
    nomisClient.getAgencyDetail.mockResolvedValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2019-04-17',
        approvalDate: '2019-04-17',
        approvalDateDisplay: '17/04/2019',
        assessmentAgencyId: 'BXI',
        assessmentStatus: 'A',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2013-03-24',
        approvalDate: '2013-03-28',
        approvalDateDisplay: '28/03/2013',
        assessmentAgencyId: 'MDI',
        agencyDescription: 'Moorlands',
        assessmentStatus: 'I',
        classification: 'Cat B',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
        approvalDate: '2012-05-05',
        approvalDateDisplay: '05/05/2012',
        agencyDescription: 'Moorlands',
        assessmentAgencyId: 'MDI',
        assessmentStatus: 'A',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2010-02-04',
        approvalDate: '2010-02-05',
        approvalDateDisplay: '05/02/2010',
        assessmentAgencyId: 'LEI',
        assessmentStatus: 'I',
      },
    ]

    const result = await service.getPrisonerBackground(context, 'ABC1')

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(3)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle a missing assessment agency', async () => {
    nomisClient.getCategoryHistory.mockResolvedValue([
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
        approvalDate: '2012-04-04',
      },
    ])
    nomisClient.getAgencyDetail.mockResolvedValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        assessmentDate: '2012-04-04',
        approvalDateDisplay: '04/04/2012',
        agencyDescription: '',
      },
    ]

    const result = await service.getPrisonerBackground(context, 'ABC1')

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(0)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })
})

describe('getCategorisationHistory', () => {
  const cats = [
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2012-04-04',
      approvalDate: '2012-04-04',
      assessmentAgencyId: 'MDI',
      assessmentStatus: 'A',
      assessmentSeq: 7,
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2012-04-04',
      assessmentAgencyId: 'LEI',
      assessmentStatus: 'P',
      assessmentSeq: 6,
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2010-02-04',
      approvalDate: '2010-02-04',
      assessmentAgencyId: 'LEI',
      assessmentStatus: 'I',
      assessmentSeq: 5,
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'B',
      classification: 'Cat B',
      assessmentDate: '2013-03-24',
      approvalDate: '2013-03-24',
      assessmentAgencyId: 'MDI',
      assessmentStatus: 'I',
      assessmentSeq: 9,
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'B',
      classification: 'Cat B',
      assessmentDate: '2019-04-17',
      approvalDate: '2019-04-17',
      assessmentAgencyId: 'BXI',
      assessmentStatus: 'A',
      assessmentSeq: 10,
    },
  ]
  test('it should return a list of historical categorisations, decorated with prison description and cat tool record', async () => {
    const sentenceTerms = [{ years: 2, months: 4, lifeSentence: true }]
    nomisClient.getOffenderDetails.mockResolvedValue({ bookingId: 45, offenderNo: 'ABC1' })
    nomisClient.getSentenceDetails.mockResolvedValue({ dummyDetails: 'stuff' })
    nomisClient.getSentenceTerms.mockResolvedValue(sentenceTerms)
    nomisClient.getMainOffence.mockResolvedValue({ mainOffence: 'stuff' })
    nomisClient.getCategoryHistory.mockResolvedValue(cats)
    formService.getHistoricalCategorisationRecords.mockResolvedValue([
      {
        bookingId: -45,
        sequence: 1,
        nomisSeq: 10,
        catType: 'INITIAL',
        status: Status.APPROVED.name,
        formObject: {
          openConditions: {
            tprs: {
              tprsSelected: 'Yes',
            },
          },
        },
      },
      { bookingId: -45, sequence: 3, nomisSeq: 7, catType: 'INITIAL', status: Status.APPROVED.name },
    ])
    nomisClient.getAgencyDetail.mockResolvedValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2019-04-17',
        approvalDateDisplay: '17/04/2019',
        assessmentAgencyId: 'BXI',
        prisonDescription: 'Moorlands',
        assessmentStatus: 'A',
        assessmentSeq: 10,
        sequence: 1,
        recordExists: true,
        tprsSelected: true,
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2013-03-24',
        approvalDateDisplay: '24/03/2013',
        assessmentAgencyId: 'MDI',
        prisonDescription: 'Moorlands',
        assessmentStatus: 'I',
        assessmentSeq: 9,
        recordExists: false,
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        assessmentDate: '2012-04-04',
        approvalDateDisplay: '04/04/2012',
        prisonDescription: 'Moorlands',
        assessmentStatus: 'A',
        assessmentSeq: 7,
        recordExists: true,
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2010-02-04',
        assessmentAgencyId: 'LEI',
        assessmentStatus: 'I',
        prisonDescription: 'Moorlands',
        assessmentSeq: 5,
        recordExists: false,
      },
    ]

    const result = await service.getCategoryHistory(context, -45, mockTransactionalClient)

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(3) // once per unique agency
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result.history).toMatchObject(expected)
  })
})

describe('getMatchedCategorisations', () => {
  const eliteCats = [
    {
      offenderNo: 'B1234AA',
      bookingId: 10,
      assessmentDate: '2018-03-28',
      assessmentSeq: 1,
      category: 'C',
      firstName: 'THE',
      lastName: 'PRISONER',
      approvalDate: '2018-03-30',
      nextReviewDate: '2018-09-28',
      categoriserFirstName: 'THE',
      categoriserLastName: 'CATEGORISER',
      approverFirstName: 'AN',
      approverLastName: 'APPROVER',
    },
    {
      offenderNo: 'B1234AA',
      bookingId: 10,
      assessmentDate: '2018-03-28',
      assessmentSeq: 2,
      category: 'B',
    },
    {
      offenderNo: 'B1234AB',
      bookingId: 11,
      assessmentDate: '2018-03-28',
      assessmentSeq: 1,
      category: 'D',
    },
    {
      offenderNo: 'B1234AB',
      bookingId: 11,
      assessmentDate: '2018-03-28',
      assessmentSeq: 2,
      category: 'I',
    },
    {
      offenderNo: 'B1234AA',
      bookingId: 10,
      assessmentDate: '2018-03-28',
      assessmentSeq: 3,
      category: 'B',
    },
    {
      offenderNo: 'B1234AB',
      bookingId: 99,
      assessmentDate: '2018-03-28',
      assessmentSeq: 3,
      category: 'B',
    },
  ]
  test('it should return the matched categorisation by nomis seq number', async () => {
    const dbCats = [
      {
        bookingId: 10,
        offenderNo: 'B1234AA',
        nomisSeq: 1,
      },
      {
        bookingId: 11,
        offenderNo: 'B1234AB',
        nomisSeq: 1,
      },
    ]

    const expected = [
      {
        offenderNo: 'B1234AA',
        bookingId: 10,
        assessmentDate: '2018-03-28',
        assessmentSeq: 1,
        category: 'C',
        firstName: 'THE',
        lastName: 'PRISONER',
        approvalDate: '2018-03-30',
        nextReviewDate: '2018-09-28',
        categoriserFirstName: 'THE',
        categoriserLastName: 'CATEGORISER',
        approverFirstName: 'AN',
        approverLastName: 'APPROVER',
      },
      {
        offenderNo: 'B1234AB',
        bookingId: 11,
        assessmentDate: '2018-03-28',
        assessmentSeq: 1,
        category: 'D',
      },
    ]

    const result = await service.getMatchedCategorisations(eliteCats, dbCats)

    expect(result).toMatchObject(expected)
  })

  test("returned results that don't match local booking ids arent populated - can't happen in reality", async () => {
    const dbCats = [
      {
        bookingId: 6,
        offenderNo: 'B1234AB',
        nomisSeq: 1,
      },
    ]

    const result = await service.getMatchedCategorisations(eliteCats, dbCats)

    const expected = [
      {
        bookingId: 6,
        offenderNo: 'B1234AB',
      },
    ]
    expect(result).toMatchObject(expected)
  })

  test('if no seq matches, it should return a record with no Nomis data', async () => {
    const dbCats = [
      {
        bookingId: 10,
        offenderNo: 'B1234AA',
        nomisSeq: 51,
        approvalDate: '2018-03-30',
      },
      {
        bookingId: 11,
        offenderNo: 'B1234AB',
        nomisSeq: 52,
        approvalDate: '2018-03-29',
      },
    ]

    const result = await service.getMatchedCategorisations(eliteCats, dbCats)

    const expected = [
      {
        offenderNo: 'B1234AA',
        bookingId: 10,
        approvalDate: '2018-03-30',
      },
      {
        offenderNo: 'B1234AB',
        bookingId: 11,
        approvalDate: '2018-03-29',
      },
    ]
    expect(result).toMatchObject(expected)
  })
})

describe('mergeU21ResultWithNomisCategorisationData', () => {
  test('it should merge in the assessStatus by booking Id', async () => {
    const u21Cats = [
      {
        bookingId: 11,
        firstName: 'Amos',
      },
      {
        bookingId: 10,
        firstName: 'Jane',
      },
      {
        bookingId: 12,
        firstName: 'Inactive',
      },
    ]

    const eliteU21Cats = [
      {
        offenderNo: 'B1234AA',
        bookingId: 10,
        assessmentStatus: 'A',
      },
      {
        offenderNo: 'B1234AA',
        bookingId: 12,
        assessmentStatus: 'I',
      },
      {
        offenderNo: 'B1234AB',
        bookingId: 11,
        assessmentStatus: 'P',
      },
    ]

    const expected = [
      {
        bookingId: 11,
        firstName: 'Amos',
        assessStatus: 'P',
      },

      {
        bookingId: 10,
        firstName: 'Jane',
        assessStatus: 'A',
      },
      {
        bookingId: 12,
        firstName: 'Inactive', // an inactive cat was returned here
      },
    ]
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(eliteU21Cats)
    const result = await service.mergeU21ResultWithNomisCategorisationData(nomisClient, 'LEI', u21Cats)

    expect(result).toMatchObject(expected)
  })
})

describe('updateNextReviewDateIfRequired', () => {
  test('calls nomis to update review date', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
    const offenderDetails = {
      offenderNo: 'GN123',
      lastName: 'SMITH',
      assessments: [{ assessmentCode: 'CATEGORY', nextReviewDate: '2020-01-16' }],
    }
    await service.updateNextReviewDateIfRequired(context, -5, offenderDetails)

    expect(nomisClient.updateNextReviewDate).toBeCalledWith(-5, '2019-06-14')
  })
  test('does not call nomis to update review date if date within 10 working days', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
    const offenderDetails = {
      offenderNo: 'GN123',
      lastName: 'SMITH',
      assessments: [{ assessmentCode: 'CATEGORY', nextReviewDate: '2019-06-05' }],
    }
    await service.updateNextReviewDateIfRequired(context, -5, offenderDetails)

    expect(nomisClient.updateNextReviewDate).not.toBeCalled()
  })
})

describe('handleRiskChangeDecision', () => {
  const sentenceTerms = [{ years: 2, months: 4, lifeSentence: false }]

  test('should handle review required decision correctly', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
    nomisClient.getSentenceDetails.mockResolvedValue({ dummyDetails: 'stuff' })
    nomisClient.getSentenceTerms.mockResolvedValue(sentenceTerms)
    nomisClient.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      lastName: 'SMITH',
      assessments: [{ assessmentCode: 'CATEGORY', nextReviewDate: '2020-01-16' }],
    })
    await service.handleRiskChangeDecision(
      context,
      -5,
      'Me',
      RiskChangeStatus.REVIEW_REQUIRED.name,
      mockTransactionalClient,
    )

    expect(nomisClient.updateNextReviewDate).toBeCalledWith(-5, '2019-06-14')
    expect(formService.updateStatusForOutstandingRiskChange).toBeCalledWith({
      offenderNo: 'GN123',
      userId: 'Me',
      status: RiskChangeStatus.REVIEW_REQUIRED.name,
      transactionalClient: mockTransactionalClient,
    })
  })
  test('should handle review required decision with next review date within 10 working days correctly', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
    nomisClient.getSentenceDetails.mockResolvedValue({ dummyDetails: 'stuff' })
    nomisClient.getSentenceTerms.mockResolvedValue(sentenceTerms)
    nomisClient.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      lastName: 'SMITH',
      assessments: [{ assessmentCode: 'CATEGORY', nextReviewDate: '2019-06-10' }],
    })
    await service.handleRiskChangeDecision(
      context,
      -5,
      'Me',
      RiskChangeStatus.REVIEW_REQUIRED.name,
      mockTransactionalClient,
    )

    expect(nomisClient.updateNextReviewDate).not.toBeCalled()
    expect(formService.updateStatusForOutstandingRiskChange).toBeCalledWith({
      offenderNo: 'GN123',
      userId: 'Me',
      status: RiskChangeStatus.REVIEW_REQUIRED.name,
      transactionalClient: mockTransactionalClient,
    })
  })
  test('should handle review NOT required decision correctly', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
    nomisClient.getSentenceDetails.mockResolvedValue({ dummyDetails: 'stuff' })
    nomisClient.getSentenceTerms.mockResolvedValue(sentenceTerms)
    nomisClient.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      lastName: 'SMITH',
      assessments: [{ assessmentCode: 'CATEGORY', nextReviewDate: '2020-01-16' }],
    })
    await service.handleRiskChangeDecision(
      context,
      -5,
      'Me',
      RiskChangeStatus.REVIEW_NOT_REQUIRED.name,
      mockTransactionalClient,
    )

    expect(nomisClient.updateNextReviewDate).not.toBeCalled()
    expect(formService.updateStatusForOutstandingRiskChange).toBeCalledWith({
      offenderNo: 'GN123',
      userId: 'Me',
      status: RiskChangeStatus.REVIEW_NOT_REQUIRED.name,
      transactionalClient: mockTransactionalClient,
    })
  })
})

describe('getRiskChanges', () => {
  test('Should filter out any alerts without a categorisation', async () => {
    const riskAlerts = [
      {
        id: 1,
        offenderNo: 'G12345',
        userId: 'me',
        status: RiskChangeStatus.NEW.name,
        raisedDate: '2022-05-05',
      },
      {
        id: 2,
        offenderNo: 'H12345',
        userId: 'me',
        status: RiskChangeStatus.NEW.name,
        raisedDate: '2022-05-05',
      },
      {
        id: 3,
        offenderNo: 'J12345',
        userId: 'me',
        status: RiskChangeStatus.NEW.name,
        raisedDate: '2022-05-05',
      },
    ]

    const offenderDetailList = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 22,
        status: Status.UNCATEGORISED.name,
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 21,
        status: Status.UNCATEGORISED.name,
      },
      {
        offenderNo: 'J12345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 20,
        status: Status.UNCATEGORISED.name,
      },
    ]

    const latestCategorisations = [
      { offenderNo: 'H12345', bookingId: 21, assessStatus: 'A', nextReviewDate: '2020-05-15' },
      { offenderNo: 'G12345', bookingId: 22, assessStatus: 'A', nextReviewDate: '2020-05-15' },
    ]

    formService.getRiskChanges.mockResolvedValue(riskAlerts)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(latestCategorisations)
    nomisClient.getOffenderDetailList.mockResolvedValue(offenderDetailList)

    const expected = [
      {
        id: 1,
        offenderNo: 'G12345',
        displayName: 'Brown, Jane',
        bookingId: 22,
        displayCreatedDate: '05/05/2022',
        displayNextReviewDate: '15/05/2020',
        status: 'NEW',
        userId: 'me',
      },
      {
        id: 2,
        offenderNo: 'H12345',
        displayName: 'Doyle, Danny',
        bookingId: 21,
        displayCreatedDate: '05/05/2022',
        displayNextReviewDate: '15/05/2020',
        status: 'NEW',
        userId: 'me',
      },
    ]

    const result = await service.getRiskChanges(context, mockTransactionalClient)

    expect(result).toMatchObject(expected)
  })

  test('No results from elite', async () => {
    nomisClient.getUncategorisedOffenders.mockResolvedValue([])
    const result = await service.getUnapprovedOffenders(context, 'LEI', mockTransactionalClient)
    expect(result).toHaveLength(0)
  })
})

describe('mergeOffenderLists', () => {
  test('standard lists', () => {
    const result = service.mergeOffenderLists(
      [
        { bookingId: 1, name: 'first1' },
        { bookingId: 2, name: 'first2' },
      ],
      [
        { bookingId: 1, name: 'second1' },
        { bookingId: 4, name: 'second4' },
      ],
    )
    expect(result).toMatchObject([
      { bookingId: 1, name: 'first1' },
      { bookingId: 2, name: 'first2' },
      { bookingId: 4, name: 'second4' },
    ])
  })
  test('empty lists - master list', () => {
    const result = service.mergeOffenderLists(
      [],
      [
        { bookingId: 1, name: 'second1' },
        { bookingId: 4, name: 'second4' },
      ],
    )
    expect(result).toMatchObject([
      { bookingId: 1, name: 'second1' },
      { bookingId: 4, name: 'second4' },
    ])
  })
  test('empty lists - second list', () => {
    const result = service.mergeOffenderLists(
      [
        { bookingId: 1, name: 'first1' },
        { bookingId: 2, name: 'first2' },
      ],
      [],
    )
    expect(result).toMatchObject([
      { bookingId: 1, name: 'first1' },
      { bookingId: 2, name: 'first2' },
    ])
  })
  test('mergeOffenderLists - ignore nulls', () => {
    const result = service.mergeOffenderLists(
      [{ bookingId: 1, name: 'first1' }, null],
      [null, { bookingId: 4, name: 'first2' }],
    )
    expect(result).toMatchObject([
      { bookingId: 1, name: 'first1' },
      { bookingId: 4, name: 'first2' },
    ])
  })
})

describe('checkAndMergeOffenderNo', () => {
  const realisticData = [
    {
      type: 'PNC',
      value: '08/97846A',
      offenderNo: 'G8879UH',
      bookingId: 1122971,
      issuedDate: '2016-11-14',
      caseloadType: 'INST',
    },
    {
      type: 'CRO',
      value: '16851/08T',
      offenderNo: 'G8879UH',
      bookingId: 1122971,
      issuedDate: '2016-11-14',
      caseloadType: 'INST',
    },
    {
      type: 'HOREF',
      value: 'K1197211',
      offenderNo: 'G8879UH',
      bookingId: 1122971,
      issuedDate: '2016-11-14',
      caseloadType: 'INST',
    },
    {
      type: 'MERGED',
      value: 'G123OLD',
      offenderNo: 'G123NEW',
      bookingId: 1122971,
      caseloadType: 'INST',
    },
    {
      type: 'MERGE_HMPS',
      value: '38384A',
      offenderNo: 'G8879UH',
      bookingId: 1122971,
      caseloadType: 'INST',
    },
  ]

  test('single merge record', async () => {
    nomisClient.getBasicOffenderDetails.mockResolvedValue({ offenderNo: 'G123NEW' })

    nomisClient.getIdentifiersByBookingId.mockResolvedValue(realisticData)
    formService.updateOffenderIdentifierReturningBookingId.mockResolvedValue({
      formRows: [{ booking_id: 123 }, { booking_id: 456 }],
      liteRows: [{ booking_id: 789 }],
    })
    formService.getCategorisationRecord.mockResolvedValue({ status: Status.APPROVED.name })
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 1, approvedDate: '2021-03-31' })

    await service.checkAndMergeOffenderNo(context, 123, mockTransactionalClient)

    expect(nomisClient.getBasicOffenderDetails).toBeCalledWith(123)
    expect(nomisClient.getIdentifiersByBookingId).toBeCalledWith(123)
    expect(formService.updateOffenderIdentifierReturningBookingId).toBeCalledWith(
      'G123OLD',
      'G123NEW',
      mockTransactionalClient,
    )
    expect(formService.getCategorisationRecord).toHaveBeenNthCalledWith(1, 123, mockTransactionalClient)
    expect(formService.getCategorisationRecord).toHaveBeenNthCalledWith(2, 456, mockTransactionalClient)
    expect(formService.getLiteCategorisation).toHaveBeenNthCalledWith(1, 789, mockTransactionalClient)
    expect(nomisClient.setInactive).not.toBeCalled()
  })

  test('single merge with cat record pending', async () => {
    nomisClient.getBasicOffenderDetails.mockResolvedValue({ offenderNo: 'G123NEW' })
    nomisClient.getIdentifiersByBookingId.mockResolvedValue(realisticData)
    formService.updateOffenderIdentifierReturningBookingId.mockResolvedValue({
      formRows: [{ booking_id: 123 }, { booking_id: 456 }],
      liteRows: [{ booking_id: 789 }],
    })
    formService.getCategorisationRecord.mockResolvedValue({ status: Status.AWAITING_APPROVAL.name })
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 1, approvedDate: null })

    await service.checkAndMergeOffenderNo(context, 123, mockTransactionalClient)

    expect(nomisClient.getBasicOffenderDetails).toBeCalledWith(123)
    expect(nomisClient.getIdentifiersByBookingId).toBeCalledWith(123)
    expect(formService.updateOffenderIdentifierReturningBookingId).toBeCalledWith(
      'G123OLD',
      'G123NEW',
      mockTransactionalClient,
    )
    expect(formService.getCategorisationRecord).toHaveBeenNthCalledWith(1, 123, mockTransactionalClient)
    expect(formService.getCategorisationRecord).toHaveBeenNthCalledWith(2, 456, mockTransactionalClient)
    expect(formService.getLiteCategorisation).toHaveBeenNthCalledWith(1, 789, mockTransactionalClient)
    expect(nomisClient.setInactive).toHaveBeenNthCalledWith(1, 123, 'ACTIVE')
    expect(nomisClient.setInactive).toHaveBeenNthCalledWith(2, 456, 'ACTIVE')
    expect(nomisClient.setInactive).toHaveBeenNthCalledWith(3, 789, 'ACTIVE')
  })
})

describe('handleExternalMovementEvent', () => {
  beforeEach(() => {
    formService.updatePrisonForm.mockReturnValue({ rowCount: 1 })
    formService.updatePrisonLite.mockReturnValue({ rowCount: 2 })
    formService.updatePrisonRiskChange.mockReturnValue({ rowCount: 3 })
    formService.updatePrisonSecurityReferral.mockReturnValue({ rowCount: 4 })
  })

  test('changed', async () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: Status.AWAITING_APPROVAL.name,
      prisonId: 'FROM',
      offenderNo: 'A1234AA',
    })
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 123, prisonId: 'FROM', approvedDate: null })

    await service.handleExternalMovementEvent(context, 123, 'A1234AA', 'ADM', 'FROM', 'TO', mockTransactionalClient)

    expect(formService.updatePrisonForm).toHaveBeenCalledWith(123, 'TO', mockTransactionalClient)
    expect(formService.updatePrisonLite).toHaveBeenCalledWith(123, 'TO', mockTransactionalClient)
    expect(formService.updatePrisonRiskChange).toHaveBeenCalledWith('A1234AA', 'TO', mockTransactionalClient)
    expect(formService.updatePrisonSecurityReferral).toHaveBeenCalledWith('A1234AA', 'TO', mockTransactionalClient)
  })

  test('not in progress', async () => {
    formService.getCategorisationRecord.mockResolvedValue({ status: Status.APPROVED.name, prisonId: 'FROM' })
    formService.getLiteCategorisation.mockResolvedValue({
      bookingId: 123,
      prisonId: 'FROM',
      approvedDate: '2021-04-21',
    })

    await service.handleExternalMovementEvent(context, 123, 'A1234AA', 'ADM', 'FROM', 'TO', mockTransactionalClient)

    expect(formService.updatePrisonForm).not.toHaveBeenCalled()
    expect(formService.updatePrisonLite).not.toHaveBeenCalled()
  })

  test('prison not changed', async () => {
    formService.getCategorisationRecord.mockResolvedValue({ status: Status.STARTED.name, prisonId: 'TO' })
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 123, prisonId: 'TO', approvedDate: null })

    await service.handleExternalMovementEvent(context, 123, 'A1234AA', 'ADM', 'FROM', 'TO', mockTransactionalClient)

    expect(formService.updatePrisonForm).not.toHaveBeenCalled()
    expect(formService.updatePrisonLite).not.toHaveBeenCalled()
  })

  test('no records', async () => {
    formService.getCategorisationRecord.mockResolvedValue({})
    formService.getLiteCategorisation.mockResolvedValue({})

    await service.handleExternalMovementEvent(context, 123, 'A1234AA', 'ADM', 'FROM', 'TO', mockTransactionalClient)

    expect(formService.updatePrisonForm).not.toHaveBeenCalled()
    expect(formService.updatePrisonLite).not.toHaveBeenCalled()
  })
})

describe('getOffenderDetailsWithNextReviewDate', () => {
  test('details with nextReviewdate found', async () => {
    nomisClient.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      lastName: 'SMITH',
      bookingId: 123,
      assessments: [{ assessmentCode: 'CATEGORY', nextReviewDate: '2020-01-16' }],
    })

    const result = await service.getOffenderDetailsWithNextReviewDate(nomisClient, 123)

    expect(result).toEqual({
      offenderNo: 'GN123',
      lastName: 'SMITH',
      bookingId: 123,
      assessments: [{ assessmentCode: 'CATEGORY', nextReviewDate: '2020-01-16' }],
      nextReviewDate: '2020-01-16',
    })
  })
  test('details without assessments found', async () => {
    nomisClient.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      lastName: 'SMITH',
      bookingId: 123,
    })

    const result = await service.getOffenderDetailsWithNextReviewDate(nomisClient, 123)

    expect(result).toEqual({
      offenderNo: 'GN123',
      lastName: 'SMITH',
      bookingId: 123,
      nextReviewDate: undefined,
    })
  })
})

describe('getDueRecats', () => {
  it('should return an empty array when no data is available', async () => {
    nomisClient.getRecategoriseOffenders.mockResolvedValue([])
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([])

    const result = await service.getDueRecats('A1234AA', {}, nomisClient, allocationClient, prisonerSearchClient)

    expect(result).toEqual([])
  })

  it('should return a filtered list of offenders pending recats - keeping nulls for records that have been filtered', async () => {
    nomisClient.getRecategoriseOffenders.mockResolvedValue([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate: '2017-09-23',
      },
      {
        offenderNo: 'G4159VQ',
        bookingId: 1185580,
        firstName: 'DEHICEY',
        lastName: 'SUMMAIN',
        assessmentDate: '2017-03-24',
        approvalDate: '2017-03-24',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'C',
        nextReviewDate: '2018-09-20',
      },
      {
        offenderNo: 'G9805GJ',
        bookingId: 1173380,
        firstName: 'CAHIRD',
        lastName: 'ASHLINDA',
        assessmentDate: '2017-02-16',
        approvalDate: '2017-02-16',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'C',
        nextReviewDate: '2017-08-15',
      },
    ])
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
      {
        bookingId: 1186272,
        releaseDate: '2017-04-12',
        sentenceStartDate: '2017-04-01',
      },
      {
        bookingId: 1185580,
        releaseDate: '2024-09-28',
        sentenceStartDate: '2016-12-19',
      },
      {
        bookingId: 1173380,
        releaseDate: '2017-04-12',
        sentenceStartDate: '2017-02-23',
      },
    ])

    const result = await service.getDueRecats('A1234AA', {}, nomisClient, allocationClient, prisonerSearchClient)

    expect(result).toEqual([
      null,
      {
        offenderNo: 'G4159VQ',
        bookingId: 1185580,
        firstName: 'DEHICEY',
        lastName: 'SUMMAIN',
        assessmentDate: '2017-03-24',
        approvalDate: '2017-03-24',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'C',
        nextReviewDate: '2018-09-20',
        displayName: 'Summain, Dehicey',
        displayStatus: 'Not started',
        reason: { name: 'DUE', value: 'Review due' },
        nextReviewDateDisplay: '20/09/2018',
        overdue: true,
        overdueText: '253 days',
        pnomis: false,
        buttonText: 'Start',
        pom: 'Steve Rendell',
      },
      null,
    ])
  })

  it('should show the expected offender who is due for a recat where their review date is before their release date', async () => {
    nomisClient.getRecategoriseOffenders.mockResolvedValue([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate: '2017-09-23',
      },
    ])
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
      {
        bookingId: 1186272,
        releaseDate: '2018-11-15',
        sentenceStartDate: '2017-04-01',
      },
    ])

    const result = await service.getDueRecats('A1234AA', {}, nomisClient, allocationClient, prisonerSearchClient)

    expect(result).toEqual([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate: '2017-09-23',
        displayName: 'Khaliam, Obinins',
        displayStatus: 'Not started',
        reason: { name: 'DUE', value: 'Review due' },
        nextReviewDateDisplay: '23/09/2017',
        overdue: true,
        overdueText: '615 days',
        pnomis: false,
        buttonText: 'Start',
        pom: 'Steve Rendell',
      },
    ])
  })

  it('should show the expected offender who is due for a recat where their due date for recall date is before their release date', async () => {
    nomisClient.getRecategoriseOffenders.mockResolvedValue([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate: '2017-09-23',
      },
    ])
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
      {
        bookingId: 1186272,
        releaseDate: '2018-11-15',
        sentenceStartDate: '2017-04-01',
        recall: true,
        postRecallReleaseDate: '2019-09-01',
      },
    ])
    nomisClient.getOffenderPrisonPeriods.mockResolvedValue({
      prisonerNumber: 'G9285UP',
      prisonPeriod: [
        {
          bookNumber: '47828A',
          bookingId: 1186272,
          entryDate: '2023-12-08T15:50:37',
          releaseDate: '2023-12-08T16:21:24',
          movementDates: [
            {
              reasonInToPrison: 'Imprisonment Without Option',
              dateInToPrison: '2019-02-28T15:53:37',
              inwardType: 'ADM',
              reasonOutOfPrison: 'Wedding/Civil Ceremony',
              dateOutOfPrison: '2019-02-28T15:53:37',
              outwardType: 'TAP',
              admittedIntoPrisonId: 'BMI',
              releaseFromPrisonId: 'BSI',
            },
            {
              reasonInToPrison: 'Wedding/Civil Ceremony',
              dateInToPrison: '2019-01-01T15:54:12',
              inwardType: 'TAP',
              reasonOutOfPrison: 'Conditional Release (CJA91) -SH Term>1YR',
              dateOutOfPrison: '2019-01-31T16:20:19',
              outwardType: 'REL',
              admittedIntoPrisonId: 'BSI',
              releaseFromPrisonId: 'AYI',
            },
          ],
        },
        {
          bookNumber: '47829A',
          bookingId: 1186273,
          entryDate: '2023-12-08T16:21:21',
          movementDates: [
            {
              reasonInToPrison: 'Imprisonment Without Option',
              dateInToPrison: '2023-12-08T16:21:21',
              inwardType: 'ADM',
              admittedIntoPrisonId: 'DGI',
            },
          ],
          transfers: [
            {
              dateOutOfPrison: '2023-12-08T16:22:02',
              dateInToPrison: '2023-12-08T16:23:32',
              transferReason: 'Overcrowding Draft',
              fromPrisonId: 'DGI',
              toPrisonId: 'BLI',
            },
          ],
          prisons: ['DGI', 'BLI'],
        },
      ],
    })

    const result = await service.getDueRecats(
      'A1234AA',
      {},
      nomisClient,
      allocationClient,
      prisonerSearchClient,
      null,
      null,
      {},
      true,
    )

    expect(result).toEqual([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate: '2017-09-23',
        displayName: 'Khaliam, Obinins',
        displayStatus: 'Not started',
        reason: { name: 'DUE', value: 'Review due' },
        nextReviewDateDisplay: '14/03/2019',
        overdue: true,
        overdueText: '78 days',
        pnomis: false,
        buttonText: 'Start',
        pom: 'Steve Rendell',
      },
    ])
  })

  it('it should not show an offender who has a release date before their next review date, AND they are not currently in review', async () => {
    const releaseDate = '2017-09-23'
    const nextReviewDate = '2017-10-23'
    nomisClient.getRecategoriseOffenders.mockResolvedValue([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate,
      },
    ])
    formService.getCategorisationRecords.mockResolvedValue([])
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
      {
        bookingId: 1186272,
        releaseDate,
        sentenceStartDate: '2017-04-01',
      },
    ])

    const result = await service.getDueRecats('A1234AA', {}, nomisClient, allocationClient, prisonerSearchClient)

    expect(result).toEqual([null])
  })

  it('it should not show an offender who has a release date AFTER their next review date, AND they are not currently in review', async () => {
    const releaseDate = '2017-09-23'
    const nextReviewDate = '2017-10-23'
    nomisClient.getRecategoriseOffenders.mockResolvedValue([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate,
      },
    ])
    formService.getCategorisationRecords.mockResolvedValue([])
    formService.getCategorisationRecord.mockImplementation(bookingId => {
      if (bookingId === 1186272) {
        return {
          id: 36,
          bookingId: 1133213,
          offenderNo: 'G9285UP',
          sequence: 1,
          userId: 'CMOSS_GEN',
          status: Status.STARTED.name,
          formObject: {
            // removed for brevity
          },
          riskProfile: {},
          assignedUserId: 'CMOSS_GEN',
          securityReferredDate: '2023-04-24T11:36:38.426Z',
          securityReferredBy: 'CMOSS_GEN',
          securityReviewedDate: '2023-04-24T11:37:07.424Z',
          securityReviewedBy: 'CMOSS_GEN',
          approvalDate: null,
          prisonId: 'DMI',
          catType: 'RECAT',
          reviewReason: 'DUE',
          nomisSeq: 5,
        }
      }
      return {}
    })
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
      {
        bookingId: 1186272,
        releaseDate,
        sentenceStartDate: '2017-04-01',
      },
    ])

    const result = await service.getDueRecats('A1234AA', {}, nomisClient, allocationClient, prisonerSearchClient)

    expect(result).toEqual([null])
  })

  test.each([Status.AWAITING_APPROVAL, Status.SECURITY_MANUAL, Status.SECURITY_BACK])(
    'it should show an offender who has a release date AFTER their next review date, AND they are currently in review with status %s',
    async status => {
      const releaseDate = '2017-09-23'
      const nextReviewDate = '2017-10-23'
      nomisClient.getRecategoriseOffenders.mockResolvedValue([
        {
          offenderNo: 'G9285UP',
          bookingId: 1186272,
          firstName: 'OBININS',
          lastName: 'KHALIAM',
          assessmentDate: '2017-03-27',
          approvalDate: '2017-03-28',
          assessmentSeq: 3,
          assessStatus: 'A',
          category: 'D',
          nextReviewDate,
        },
      ])
      formService.getCategorisationRecords.mockResolvedValue([])
      formService.getCategorisationRecord.mockImplementation(bookingId => {
        if (bookingId === 1186272) {
          return {
            id: 36,
            bookingId: 1133213,
            offenderNo: 'G9285UP',
            sequence: 1,
            userId: 'CMOSS_GEN',
            status: status.name,
            formObject: {
              // removed for brevity
            },
            riskProfile: {},
            assignedUserId: 'CMOSS_GEN',
            securityReferredDate: '2023-04-24T11:36:38.426Z',
            securityReferredBy: 'CMOSS_GEN',
            securityReviewedDate: '2023-04-24T11:37:07.424Z',
            securityReviewedBy: 'CMOSS_GEN',
            approvalDate: null,
            prisonId: 'DMI',
            catType: 'RECAT',
            reviewReason: 'DUE',
            nomisSeq: 5,
          }
        }
        return {}
      })
      prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
        {
          bookingId: 1186272,
          releaseDate,
          sentenceStartDate: '2017-04-01',
        },
      ])

      const result = await service.getDueRecats('A1234AA', {}, nomisClient, allocationClient, prisonerSearchClient)

      expect(result).toEqual([
        {
          offenderNo: 'G9285UP',
          bookingId: 1186272,
          firstName: 'OBININS',
          lastName: 'KHALIAM',
          assessmentDate: '2017-03-27',
          approvalDate: '2017-03-28',
          assessmentSeq: 3,
          assessStatus: 'A',
          category: 'D',
          nextReviewDate: '2017-10-23',
          displayName: 'Khaliam, Obinins',
          displayStatus: status.value,
          dbStatus: status.name,
          reason: { name: 'DUE', value: 'Review due' },
          nextReviewDateDisplay: '23/10/2017',
          overdue: true,
          overdueText: '585 days',
          dbRecordExists: true,
          pnomis: status.name === Status.AWAITING_APPROVAL.name ? 'PNOMIS' : false,
          buttonText: status.name === Status.AWAITING_APPROVAL.name ? 'Start' : 'Edit',
          pom: 'Steve Rendell',
        },
      ])
    },
    10000,
  )

  it('it should show an offender who has a release date AFTER their next review date, AND they are currently in Rejected By Supervisor', async () => {
    const releaseDate = moment().add(7, 'months')
    const nextReviewDate = moment().add(9, 'months')
    nomisClient.getRecategoriseOffenders.mockResolvedValue([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate,
      },
    ])
    formService.getCategorisationRecords.mockResolvedValue([])
    formService.getCategorisationRecord.mockImplementation(bookingId => {
      if (bookingId === 1186272) {
        return {
          id: 36,
          bookingId: 1133213,
          offenderNo: 'G9285UP',
          sequence: 1,
          userId: 'CMOSS_GEN',
          status: Status.SUPERVISOR_BACK.name,
          formObject: {
            // removed for brevity
          },
          riskProfile: {},
          assignedUserId: 'CMOSS_GEN',
          securityReferredDate: '2023-04-24T11:36:38.426Z',
          securityReferredBy: 'CMOSS_GEN',
          securityReviewedDate: '2023-04-24T11:37:07.424Z',
          securityReviewedBy: 'CMOSS_GEN',
          approvalDate: null,
          prisonId: 'DMI',
          catType: 'RECAT',
          reviewReason: 'DUE',
          nomisSeq: 5,
        }
      }
      return {}
    })
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
      {
        bookingId: 1186272,
        releaseDate,
        sentenceStartDate: '2017-04-01',
      },
    ])

    const result = await service.getDueRecats('A1234AA', {}, nomisClient, allocationClient, prisonerSearchClient)

    expect(result).toEqual([
      {
        offenderNo: 'G9285UP',
        bookingId: 1186272,
        firstName: 'OBININS',
        lastName: 'KHALIAM',
        assessmentDate: '2017-03-27',
        approvalDate: '2017-03-28',
        assessmentSeq: 3,
        assessStatus: 'A',
        category: 'D',
        nextReviewDate,
        displayName: 'Khaliam, Obinins',
        displayStatus: 'Back from Supervisor',
        dbStatus: 'SUPERVISOR_BACK',
        reason: { name: 'DUE', value: 'Review due' },
        nextReviewDateDisplay: dateConverter(nextReviewDate),
        overdue: false,
        overdueText: '',
        dbRecordExists: true,
        pnomis: false,
        buttonText: 'Edit',
        pom: 'Steve Rendell',
      },
    ])
  })
})

describe('isNextReviewAfterRelease', () => {
  const nomisRecord = { nextReviewDate: '2023-04-23' }
  const releaseDate = '2023-04-22'

  it('returns true when next review date is after release date', () => {
    const result = service.isNextReviewAfterRelease(nomisRecord, releaseDate)
    expect(result).toBe(true)
  })

  it('returns false when next review date is before release date', () => {
    nomisRecord.nextReviewDate = '2023-04-21'
    const result = service.isNextReviewAfterRelease(nomisRecord, releaseDate)
    expect(result).toBe(false)
  })

  it('returns false when next review date is equal to release date', () => {
    nomisRecord.nextReviewDate = '2023-04-22'
    const result = service.isNextReviewAfterRelease(nomisRecord, releaseDate)
    expect(result).toBe(false)
  })

  describe('potentially unexpected behaviour - returns null rather than false', () => {
    const nullButShouldProbablyBeFalse = null

    it('returns false when next review date is not provided', () => {
      nomisRecord.nextReviewDate = null
      const result = service.isNextReviewAfterRelease(nomisRecord, releaseDate)
      expect(result).toBe(nullButShouldProbablyBeFalse)
    })

    it('returns false when release date is not provided', () => {
      const result = service.isNextReviewAfterRelease(nomisRecord, null)
      expect(result).toBe(nullButShouldProbablyBeFalse)
    })
  })
})

describe('getReleaseDateMap', () => {
  const offenderList = [
    { bookingId: 'bookingId1', dbRecord: { catType: CatType.RECAT.name } },
    { bookingId: 'bookingId2', dbRecord: null },
    { bookingId: 'bookingId3', dbRecord: { catType: 'Other CatType' } },
  ]

  beforeEach(() => {
    prisonerSearchClient.getPrisonersByBookingIds.mockResolvedValue([
      { bookingId: 'bookingId1', releaseDate: '2023-05-01' },
      { bookingId: 'bookingId2', releaseDate: null },
      { bookingId: 'bookingId3', releaseDate: '2023-04-30' },
      { bookingId: 'bookingId4' }, // This record doesn't have a releaseDate
    ])
  })

  it('should return a Map of bookingIds and releaseDates', async () => {
    const releaseDateMap = await service.getReleaseDateMap(offenderList, prisonerSearchClient)

    expect(releaseDateMap).toBeInstanceOf(Map)
    expect(releaseDateMap.size).toBe(2)
    expect(releaseDateMap.get('bookingId1')).toBe('2023-05-01')
    expect(releaseDateMap.get('bookingId3')).toBe('2023-04-30')
  })

  it('should handle offenderList with no matching records', async () => {
    const emptyOffenderList = []
    const releaseDateMap = await service.getReleaseDateMap(emptyOffenderList, prisonerSearchClient)

    expect(releaseDateMap).toBeInstanceOf(Map)
    expect(releaseDateMap.size).toBe(2)
  })

  it('should handle prisonerSearchClient returning no records', async () => {
    const emptyPrisoners = []
    prisonerSearchClient.getPrisonersByBookingIds.mockReturnValue(emptyPrisoners)

    const releaseDateMap = await service.getReleaseDateMap(offenderList, prisonerSearchClient)

    expect(releaseDateMap).toBeInstanceOf(Map)
    expect(releaseDateMap.size).toBe(0)
  })

  it('should handle prisonerSearchClient throwing an error', async () => {
    const errorMessage = 'Error retrieving prisoners'
    prisonerSearchClient.getPrisonersByBookingIds.mockImplementation(() => {
      throw new Error(errorMessage)
    })

    await expect(service.getReleaseDateMap(offenderList, prisonerSearchClient)).rejects.toThrow(errorMessage)
  })
})

describe('getPomMap', () => {
  const mockAllocationClient = {
    getPomByOffenderNo: jest.fn().mockImplementation(() => Promise.resolve({ name: 'John Doe' })),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('returns an empty map when given an empty offender list', async () => {
    const result = await service.getPomMap([], mockAllocationClient)

    expect(result.size).toBe(0)
  })

  test('returns a map with one entry when given a single offender', async () => {
    const offender = { offenderNo: 'exists' }
    const result = await service.getPomMap([offender], mockAllocationClient)

    expect(result.size).toBe(1)
    expect(result.get(offender.offenderNo)).toEqual({ name: 'John Doe' })
    expect(mockAllocationClient.getPomByOffenderNo).toHaveBeenCalledTimes(1)
    expect(mockAllocationClient.getPomByOffenderNo).toHaveBeenCalledWith(offender.offenderNo)
  })

  test('returns a map with multiple entries when given multiple offenders', async () => {
    const offender1 = { offenderNo: '123' }
    const offender2 = { prisonerNumber: '456' }
    const result = await service.getPomMap([offender1, offender2], mockAllocationClient)

    expect(result.size).toBe(2)
    expect(result.get(offender1.offenderNo)).toEqual({ name: 'John Doe' })
    expect(result.get(offender2.prisonerNumber)).toEqual({ name: 'John Doe' })
    expect(mockAllocationClient.getPomByOffenderNo).toHaveBeenCalledTimes(2)
    expect(mockAllocationClient.getPomByOffenderNo).toHaveBeenCalledWith(offender1.offenderNo)
    expect(mockAllocationClient.getPomByOffenderNo).toHaveBeenCalledWith(offender2.prisonerNumber)
  })

  test('throws an error if allocationClient.getPomByOffenderNo throws an error', async () => {
    mockAllocationClient.getPomByOffenderNo.mockRejectedValueOnce(new Error('API error'))

    await expect(service.getPomMap([{ offenderNo: 'exists' }], mockAllocationClient)).rejects.toThrow('API error')
    expect(mockAllocationClient.getPomByOffenderNo).toHaveBeenCalledTimes(1)
  })
})

describe('isInitialInProgress', () => {
  it('returns false when given a dbRecord with a catType other than INITIAL', () => {
    const dbRecord = { catType: 'OTHER' }
    const result = service.isInitialInProgress(dbRecord)
    expect(result).toBe(false)
  })

  it('returns false when given a dbRecord with no catType', () => {
    const dbRecord = {}
    const result = service.isInitialInProgress(dbRecord)
    expect(result).toBe(false)
  })

  it('returns false when given a dbRecord with a catType of null', () => {
    const dbRecord = { catType: null }
    const result = service.isInitialInProgress(dbRecord)
    expect(result).toBe(false)
  })

  it('returns false when given a dbRecord with a catType of undefined', () => {
    const dbRecord = { catType: undefined }
    const result = service.isInitialInProgress(dbRecord)
    expect(result).toBe(false)
  })

  describe('when calling through to inProgress', () => {
    it('returns false when given a dbRecord with an approved status', () => {
      const dbRecord = { catType: CatType.INITIAL.name, status: Status.APPROVED.name }
      const result = service.isInitialInProgress(dbRecord)
      expect(result).toBe(false)
    })

    it('returns true when given a dbRecord with an in-progress status', () => {
      const dbRecord = { catType: CatType.INITIAL.name, status: Status.SUPERVISOR_BACK.name }
      const result = service.isInitialInProgress(dbRecord)
      expect(result).toBe(true)
    })
  })
})

describe('calculateRecatDisplayStatus', () => {
  it('returns "Not started" when given an empty or undefined displayStatus', () => {
    expect(service.calculateRecatDisplayStatus(undefined)).toBe('Not started')
    expect(service.calculateRecatDisplayStatus(null)).toBe('Not started')
    expect(service.calculateRecatDisplayStatus('')).toBe('Not started')
  })

  it('returns "Not started" when given displayStatus === Status.APPROVED.value', () => {
    expect(service.calculateRecatDisplayStatus(Status.APPROVED.value)).toBe('Not started')
  })

  it('returns the original displayStatus when it is not equal to the value of the "APPROVED" status', () => {
    Object.values(Status)
      .filter(({ name }) => name !== Status.APPROVED.name)
      .forEach(({ value }) => expect(service.calculateRecatDisplayStatus(value)).toBe(value))
  })
})

describe('statusTextDisplay', () => {
  it('returns an empty string for an invalid input', () => {
    expect(service.statusTextDisplay(undefined)).toEqual('')
    expect(service.statusTextDisplay(null)).toEqual('')
    expect(service.statusTextDisplay('invalid')).toEqual('')
    expect(service.statusTextDisplay(3)).toEqual('')
  })

  it('returns the correct status text for valid inputs', () => {
    expect(service.statusTextDisplay(Status.SUPERVISOR_BACK.name)).toEqual('Back from Supervisor')

    Object.values(Status).forEach(({ name, value }) => expect(service.statusTextDisplay(name)).toEqual(value))
  })
})

describe('decorateWithCategorisationData', () => {
  let mockOffender
  let mockUser
  let mockNomisClient

  beforeEach(() => {
    mockOffender = { bookingId: 12345, status: 'status' }
    mockUser = { username: 'username', firstName: 'firstname', lastName: 'lastname' }
    mockNomisClient = {
      getUserByUserId: jest.fn(() => Promise.resolve({ firstName: 'firstname', lastName: 'lastname' })),
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it(`returns an object with displayStatus: '' when categorisation.status is undefined`, async () => {
    const result = await service.decorateWithCategorisationData(mockOffender, mockUser, mockNomisClient, {})
    expect(result).toEqual({ displayStatus: '' })
  })

  it('returns an object with displayStatus and assigned user details when categorisation.assignedUserId is not the current user', async () => {
    const mockCategorisation = { status: Status.STARTED.name, assignedUserId: 'otheruser' }
    const result = await service.decorateWithCategorisationData(
      mockOffender,
      mockUser,
      mockNomisClient,
      mockCategorisation,
    )
    const expectedStatusText = `${service.statusTextDisplay(mockCategorisation.status)} (Firstname Lastname)`
    expect(mockNomisClient.getUserByUserId).toHaveBeenCalledWith(mockCategorisation.assignedUserId)
    expect(result).toEqual({
      dbRecordExists: true,
      dbStatus: mockCategorisation.status,
      displayStatus: expectedStatusText,
      assignedUserId: mockCategorisation.assignedUserId,
    })
  })

  it('returns an object with displayStatus and assigned user details when categorisation.assignedUserId is the current user', async () => {
    const mockCategorisation = { status: Status.STARTED.name, assignedUserId: mockUser.username }
    const result = await service.decorateWithCategorisationData(
      mockOffender,
      mockUser,
      mockNomisClient,
      mockCategorisation,
    )
    const expectedStatusText = `${service.statusTextDisplay(mockCategorisation.status)} (Firstname Lastname)`
    expect(mockNomisClient.getUserByUserId).not.toHaveBeenCalled()
    expect(result).toEqual({
      dbRecordExists: true,
      dbStatus: mockCategorisation.status,
      displayStatus: expectedStatusText,
      assignedUserId: mockCategorisation.assignedUserId,
    })
  })

  it('returns an object with displayStatus and no assigned user details when categorisation.assignedUserId is not provided', async () => {
    const mockCategorisation = { status: Status.APPROVED.name }
    const result = await service.decorateWithCategorisationData(
      mockOffender,
      mockUser,
      mockNomisClient,
      mockCategorisation,
    )
    const expectedStatusText = service.statusTextDisplay(mockCategorisation.status)
    expect(result).toEqual({
      dbRecordExists: true,
      dbStatus: mockCategorisation.status,
      displayStatus: expectedStatusText,
      assignedUserId: undefined,
    })
  })
})

describe('statusTextDisplay', () => {
  test.each([
    Status.AWAITING_APPROVAL.name,
    Status.SECURITY_MANUAL.name,
    Status.SECURITY_AUTO.name,
    Status.SECURITY_BACK.name,
  ])(
    'returns true for status',
    async status => {
      expect(service.isAwaitingApprovalOrSecurity(status)).toBeTruthy()
    },
    10000,
  )

  test.each([
    Status.UNCATEGORISED.name,
    Status.STARTED.name,
    Status.SECURITY_FLAGGED.name,
    Status.APPROVED.name,
    Status.SUPERVISOR_BACK.name,
    Status.CANCELLED.name,
  ])(
    'returns false for status',
    async status => {
      expect(service.isAwaitingApprovalOrSecurity(status)).toBeFalsy()
    },
    10000,
  )
})

describe('isNextReviewAfterRelease', () => {
  const testCases = [
    {
      description: 'should return true if next review date is after release date',
      nomisRecord: {
        nextReviewDate: '2023-08-20',
      },
      releaseDate: '2023-08-15',
      expected: true,
    },
    {
      description: 'should return false if next review date is before release date',
      nomisRecord: {
        nextReviewDate: '2023-08-10',
      },
      releaseDate: '2023-08-15',
      expected: false,
    },
    {
      description: 'should return false if next review date is the same as release date',
      nomisRecord: {
        nextReviewDate: '2023-08-15',
      },
      releaseDate: '2023-08-15',
      expected: false,
    },
    {
      description: 'should return false if next review date is not a valid date',
      nomisRecord: {
        nextReviewDate: 'invalid-date',
      },
      releaseDate: '2023-08-15',
      expected: false,
    },
    {
      description: 'should return false if release date is not a valid date',
      nomisRecord: {
        nextReviewDate: '2023-08-20',
      },
      releaseDate: 'invalid-date',
      expected: false,
    },
    // possibly unexpected cases
    {
      description: 'returns null if next review date is null',
      nomisRecord: {
        nextReviewDate: null,
      },
      releaseDate: '2023-08-15',
      expected: null,
    },
    {
      description: 'returns null if release date is null',
      nomisRecord: {
        nextReviewDate: '2023-08-20',
      },
      releaseDate: null,
      expected: null,
    },
    {
      description: 'returns undefined if both next review date and release date are missing',
      nomisRecord: {},
      releaseDate: null,
      expected: undefined,
    },
    {
      description: 'returns undefined if next review date is missing and release date is valid',
      nomisRecord: {},
      releaseDate: '2023-08-15',
      expected: undefined,
    },
    {
      description: 'returns null if next review date is valid and release date is missing',
      nomisRecord: {
        nextReviewDate: '2023-08-20',
      },
      releaseDate: null,
      expected: null,
    },
  ]

  testCases.forEach(({ description, nomisRecord, releaseDate, expected }) => {
    it(description, () => {
      const result = service.isNextReviewAfterRelease(nomisRecord, releaseDate)
      expect(result).toBe(expected)
    })
  })
})

describe('isRejectedBySupervisorSuitableForDisplay', () => {
  beforeEach(() => {
    // this is necessary as other tests mess with the globally set value
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
  })

  const testCases = [
    {
      description: 'should return false if status is not supervisor back and release date is in the past',
      dbRecord: {
        status: Status.APPROVED.name,
      },
      releaseDate: mockTodaySubtract(1),
      expected: false,
    },
    {
      description: 'should return false if status is not supervisor back and release date is in the future',
      dbRecord: {
        status: Status.APPROVED.name,
      },
      releaseDate: moment().add(1, 'week'),
      expected: false,
    },
    {
      description: 'should return false if status is not supervisor back and release date is today',
      dbRecord: {
        status: Status.APPROVED.name,
      },
      releaseDate: moment(),
      expected: false,
    },
    {
      description: 'should return false if status is supervisor back and release date is in the past',
      dbRecord: {
        status: Status.SUPERVISOR_BACK.name,
      },
      releaseDate: mockTodaySubtract(37),
      expected: false,
    },
    {
      description: 'should return true if status is supervisor back and release date is in the future',
      dbRecord: {
        status: Status.SUPERVISOR_BACK.name,
      },
      releaseDate: moment().add(1, 'month'),
      expected: true,
    },
    {
      description: 'should return true if status is supervisor back and release date is null',
      dbRecord: {
        status: Status.SUPERVISOR_BACK.name,
      },
      releaseDate: null,
      expected: true,
    },
    {
      description: 'should return true if status is supervisor back and release date is today',
      dbRecord: {
        status: Status.SUPERVISOR_BACK.name,
      },
      releaseDate: moment(),
      expected: true,
    },
    {
      description: 'should return false if status is invalid and release date is in the past',
      dbRecord: {
        status: 'invalid-status',
      },
      releaseDate: mockTodaySubtract(44),
      expected: false,
    },
    {
      description: 'should return true if status is supervisor back and release date is not a valid date',
      dbRecord: {
        status: Status.SUPERVISOR_BACK.name,
      },
      releaseDate: 'invalid-date',
      expected: true,
    },
    {
      description: 'should return true if status is supervisor back and release date is null',
      dbRecord: {
        status: Status.SUPERVISOR_BACK.name,
      },
      releaseDate: null,
      expected: true,
    },
    {
      description: 'should return false if status is missing and release date is in the past',
      dbRecord: {},
      releaseDate: mockTodaySubtract(2),
      expected: false,
    },
    {
      description: 'should return true if status is supervisor back and release date is missing',
      dbRecord: {
        status: Status.SUPERVISOR_BACK.name,
      },
      releaseDate: null,
      expected: true,
    },
  ]

  testCases.forEach(({ description, dbRecord, releaseDate, expected }) => {
    it(description, () => {
      const result = service.isRejectedBySupervisorSuitableForDisplay(dbRecord, releaseDate)
      expect(result).toBe(expected)
    })
  })

  describe('getU21Recats', () => {
    let peterPan

    beforeEach(() => {
      peterPan = {
        bookingId: 123,
        prisonerNumber: 'G12345',
        firstName: 'PETER',
        lastName: 'PAN',
        dateOfBirth: '1998-05-01',
        category: 'I',
        legalStatus: 'SENTENCED',
      }
    })

    it('should return an empty array when no data is available', async () => {
      prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue([])

      const result = await service.getU21Recats(
        'A1234AA',
        {},
        nomisClient,
        allocationClient,
        prisonerSearchClient,
        risksAndNeedsClient,
        probationOffenderSearchApiClient,
      )

      expect(result).toEqual([])
    })

    it('it should return the under 21 result when found', async () => {
      const u21Data = [peterPan]

      const u21CatData = [{ bookingId: 123, assessStatus: 'P' }]

      const expected = [
        {
          offenderNo: 'G12345',
          displayName: 'Pan, Peter',
          bookingId: 123,
          displayStatus: 'Awaiting approval',
          nextReviewDateDisplay: '01/05/2019',
          reason: ReviewReason.AGE,
          overdue: true,
          buttonText: 'View',
        },
      ]
      prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
      nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)
      // no manually started recats
      formService.getCategorisationRecords.mockResolvedValue([])
      formService.getCategorisationRecord.mockResolvedValue({ bookingId: 123, status: Status.AWAITING_APPROVAL.name })

      const result = await service.getU21Recats(
        'A1234AA',
        {},
        nomisClient,
        allocationClient,
        prisonerSearchClient,
        risksAndNeedsClient,
        probationOffenderSearchApiClient,
      )
      expect(prisonerSearchClient.getPrisonersAtLocation).toBeCalled()
      expect(formService.getCategorisationRecord).toBeCalledTimes(1)
      expect(result).toMatchObject(expected)
    })

    it('should return a filtered list of u21 offenders pending recats - keeping nulls for records that have been filtered', async () => {
      const u21Data = [
        {
          bookingId: 456,
          prisonerNumber: 'G45678',
          firstName: 'SIMON',
          lastName: 'SIMPSON',
          dateOfBirth: '1998-04-02',
          category: 'I',
          legalStatus: 'CIVIL_PRISONER',
        },
        {
          bookingId: 123,
          prisonerNumber: 'G12345',
          firstName: 'PETER',
          lastName: 'PAN',
          dateOfBirth: '1998-05-01',
          category: 'I',
          legalStatus: 'SENTENCED',
        },
      ]

      const u21CatData = [
        { bookingId: 123, assessStatus: 'P' },
        { bookingId: 456, assessStatus: 'P' },
      ]

      const expected = [
        null,
        {
          offenderNo: 'G12345',
          bookingId: 123,
          firstName: 'PETER',
          lastName: 'PAN',
          dateOfBirth: '1998-05-01',
          displayName: 'Pan, Peter',
          displayStatus: 'Awaiting approval',
          dbStatus: 'AWAITING_APPROVAL',
          reason: { name: 'AGE', value: 'Age 21' },
          nextReviewDateDisplay: '01/05/2019',
          overdue: true,
          dbRecordExists: true,
          pnomis: 'PNOMIS',
          buttonText: 'View',
          pom: 'Steve Rendell',
        },
      ]

      prisonerSearchClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
      nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)
      formService.getCategorisationRecord.mockResolvedValueOnce({
        bookingId: 456,
        catType: CatType.INITIAL.name,
        status: Status.STARTED.name,
      })
      formService.getCategorisationRecord.mockResolvedValueOnce({
        bookingId: 123,
        status: Status.AWAITING_APPROVAL.name,
      })

      const result = await service.getU21Recats(
        'A1234AA',
        {},
        nomisClient,
        allocationClient,
        prisonerSearchClient,
        risksAndNeedsClient,
        probationOffenderSearchApiClient,
      )
      expect(prisonerSearchClient.getPrisonersAtLocation).toBeCalled()
      expect(formService.getCategorisationRecord).toBeCalledTimes(2)
      expect(result).toMatchObject(expected)
    })
  })
})
