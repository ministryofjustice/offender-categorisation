const moment = require('moment')
const serviceCreator = require('../../server/services/offendersService')
const Status = require('../../server/utils/statusEnum')
const ReviewReason = require('../../server/utils/reviewReasonEnum')
const RiskChangeStatus = require('../../server/utils/riskChangeStatusEnum')

const DATE_MATCHER = '\\d{2}/\\d{2}/\\d{4}'
const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const context = { user: { token: 'token', username: 'username', activeCaseLoad: { caseLoadId: 'LEI' } } }

const nomisClient = {
  getUncategorisedOffenders: jest.fn(),
  getSentenceDatesForOffenders: jest.fn(),
  getRecategoriseOffenders: jest.fn(),
  getPrisonersAtLocation: jest.fn(),
  getUserByUserId: jest.fn(),
  getOffenderDetails: jest.fn(),
  getOffenderDetailList: jest.fn(),
  getUserDetailList: jest.fn(),
  getSentenceDetails: jest.fn(),
  getSentenceTerms: jest.fn(),
  getMainOffence: jest.fn(),
  getMainOffences: jest.fn(),
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
}

const formService = {
  getCategorisationRecord: jest.fn(),
  getSecurityReferredOffenders: jest.fn(),
  getCategorisedOffenders: jest.fn(),
  updateStatusForOutstandingRiskChange: jest.fn(),
  getRiskChanges: jest.fn(),
  getHistoricalCategorisationRecords: jest.fn(),
  backToCategoriser: jest.fn(),
  recordNomisSeqNumber: jest.fn(),
  updateOffenderIdentifierReturningBookingId: jest.fn(),
  recordLiteCategorisation: jest.fn(),
  approveLiteCategorisation: jest.fn(),
  getUnapprovedLite: jest.fn(),
}

const nomisClientBuilder = () => nomisClient

let service

beforeEach(() => {
  service = serviceCreator(nomisClientBuilder, formService)
  nomisClient.getMainOffences.mockReturnValue([])
  formService.getCategorisationRecord.mockReturnValue({})
})

afterEach(() => {
  nomisClient.getUncategorisedOffenders.mockReset()
  nomisClient.getSentenceDatesForOffenders.mockReset()
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
  nomisClient.getCategoryHistory.mockReset()
  nomisClient.getAgencyDetail.mockReset()
  nomisClient.getCategorisedOffenders.mockReset()
  nomisClient.getLatestCategorisationForOffenders.mockReset()
  nomisClient.updateNextReviewDate.mockReset()
})

moment.now = jest.fn()
// NOTE: mock current date!
moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))

function mockTodaySubtract(days) {
  return moment()
    .subtract(days, 'day')
    .format('YYYY-MM-DD')
}

describe('getRecategoriseOffenders', () => {
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
    ]

    const u21Data = [
      {
        bookingId: 21,
        offenderNo: 'U2101AA',
        firstName: 'PETER',
        lastName: 'PAN',
        dateOfBirth: '1998-05-01',
        categoryCode: 'I',
      },
      {
        bookingId: 22,
        offenderNo: 'U2102AA',
        firstName: 'JUSTIN',
        lastName: 'BEIBER',
        dateOfBirth: '1998-06-01',
        categoryCode: 'J',
      },
      {
        bookingId: 23,
        offenderNo: 'U2103AA',
        firstName: 'SOMEONE',
        lastName: 'ELSE',
        dateOfBirth: '1998-06-01',
        categoryCode: 'B',
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
    ]
    nomisClient.getRecategoriseOffenders.mockResolvedValue(dueData)
    nomisClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)
    formService.getCategorisationRecord.mockImplementation((bookingId, transactionalClient) => {
      expect(transactionalClient).toEqual(mockTransactionalClient)
      switch (bookingId) {
        case 22:
          return { bookingId, status: Status.APPROVED.name }
        case 122:
          return { bookingId, status: Status.APPROVED.name }
        case 123:
          return { bookingId, status: Status.SECURITY_MANUAL.name }
        default:
          return {}
      }
    })

    const result = await service.getRecategoriseOffenders(context, 'user1', mockTransactionalClient)

    expect(nomisClient.getRecategoriseOffenders.mock.calls[0][0]).toEqual('LEI')
    expect(nomisClient.getPrisonersAtLocation).toBeCalled()
    expect(formService.getCategorisationRecord).toBeCalledTimes(5)
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
        offenderNo: 'G12345',
        firstName: 'PETER',
        lastName: 'PAN',
        dateOfBirth: '1998-05-01',
        categoryCode: 'I',
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
    nomisClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)
    formService.getCategorisationRecord.mockResolvedValue({ bookingId: 123, status: Status.AWAITING_APPROVAL.name })

    const result = await service.getRecategoriseOffenders(context, 'user1', mockTransactionalClient)

    expect(nomisClient.getRecategoriseOffenders.mock.calls[0][0]).toEqual('LEI')
    expect(nomisClient.getPrisonersAtLocation).toBeCalled()
    expect(formService.getCategorisationRecord).toBeCalledTimes(2)
    expect(result).toMatchObject(expected)
  })

  test('No results from elite', async () => {
    nomisClient.getRecategoriseOffenders.mockResolvedValue([])
    nomisClient.getPrisonersAtLocation.mockResolvedValue([])

    const result = await service.getRecategoriseOffenders(context, 'LEI', 'user1', mockTransactionalClient)
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
        offenderNo: 'U2101AA',
        firstName: 'PETER',
        lastName: 'PAN',
        dateOfBirth: '1998-05-01',
        categoryCode: 'I',
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
    nomisClient.getPrisonersAtLocation.mockResolvedValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockResolvedValue(u21CatData)

    const result = await service.getRecategoriseOffenders(context, 'LEI', 'user1', mockTransactionalClient)

    expect(result).toHaveLength(0)
    expect(formService.getCategorisationRecord).toBeCalledTimes(2)
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
      { sentenceDetail: { bookingId: 1, sentenceStartDate: mockTodaySubtract(30) } }, // 2019-05-01
      { sentenceDetail: { bookingId: 6, sentenceStartDate: mockTodaySubtract(18) } }, // 2019-05-13
    ]
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)

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
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledWith([1, 6])
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
      { sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) } },
      { sentenceDetail: { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) } },
      { sentenceDetail: { bookingId: 122, sentenceStartDate: mockTodaySubtract(10) } },
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
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue({})

    const result = await service.getUncategorisedOffenders(context, 'user1', mockTransactionalClient)

    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle an empty response', async () => {
    const uncategorised = []
    const expected = []

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)

    const result = await service.getUncategorisedOffenders(context, 'user1', mockTransactionalClient)
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

    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123 },
      },
    ]

    const expected = []

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue({})

    const result = await service.getUncategorisedOffenders(context, 'user1', mockTransactionalClient)
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })

  test('it should propagate an error response', async () => {
    nomisClient.getUncategorisedOffenders.mockRejectedValue(new Error())
    try {
      service.getUncategorisedOffenders('MDI')
      expect(service.shouldNotReachHere) // service will rethrow error
    } catch (error) {
      /* do nothing */
    }
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

    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123 },
      },
    ]

    const expected = []

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue({})

    const result = await service.getUncategorisedOffenders(context, mockTransactionalClient)
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
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

    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      },
    ]
    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue(dbRecord)

    const result = await service.getUncategorisedOffenders(context, mockTransactionalClient)
    expect(result[0].pnomis).toBe(true)
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
      { sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) } },
      { sentenceDetail: { bookingId: 111, sentenceStartDate: mockTodaySubtract(4) } },
    ]

    const offences = [
      { bookingId: 123, offenceCode: 'OKCODE', statuteCode: 'ZZ' },
      { bookingId: 111, offenceCode: 'IA99000-001N', statuteCode: 'ZZ' },
    ]
    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)
    nomisClient.getMainOffences.mockResolvedValue(offences)

    const results = await service.getUncategorisedOffenders(context, mockTransactionalClient)
    expect(results).toHaveLength(1)
    expect(results[0].bookingId).toEqual(123)
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

describe('getUncategorisedOffenders calculates inconsistent data correctly', () => {
  test.each`
    nomisStatus                      | localStatus                      | pnomis
    ${Status.UNCATEGORISED.name}     | ${Status.SUPERVISOR_BACK.name}   | ${false}
    ${Status.UNCATEGORISED.name}     | ${Status.SECURITY_BACK.name}     | ${false}
    ${Status.UNCATEGORISED.name}     | ${Status.AWAITING_APPROVAL.name} | ${true}
    ${Status.AWAITING_APPROVAL.name} | ${Status.SECURITY_BACK.name}     | ${false}
    ${Status.AWAITING_APPROVAL.name} | ${Status.SECURITY_MANUAL.name}   | ${false}
    ${Status.AWAITING_APPROVAL.name} | ${Status.SUPERVISOR_BACK.name}   | ${false}
    ${Status.AWAITING_APPROVAL.name} | ${Status.STARTED.name}           | ${true}
  `('should return errors $expectedContent for form return', async ({ nomisStatus, localStatus, pnomis }) => {
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

    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      },
    ]
    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)
    formService.getCategorisationRecord.mockResolvedValue(dbRecord)
    const result = await service.getUncategorisedOffenders(context, mockTransactionalClient)
    expect(result[0].pnomis).toBe(pnomis)
  })
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
  ]

  test('it should return a list of offenders and sentence information', async () => {
    const sentenceDates = [
      { sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) } },
      { sentenceDetail: { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) } },
      { sentenceDetail: { bookingId: 122, sentenceStartDate: mockTodaySubtract(10) } },
    ]

    nomisClient.getOffenderDetailList.mockResolvedValue(offenderDetailList)
    nomisClient.getUserDetailList.mockResolvedValue(userDetailsList)
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)

    formService.getSecurityReferredOffenders.mockImplementation(() => securityReferredOffenders)

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
    ]

    const result = await service.getReferredOffenders(context, mockTransactionalClient)

    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should return offenders without a sentence, as these can now be referred', async () => {
    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      },
      {
        sentenceDetail: { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) },
      },
    ]

    nomisClient.getOffenderDetailList.mockResolvedValue(offenderDetailList)
    nomisClient.getUserDetailList.mockResolvedValue(userDetailsList)
    nomisClient.getSentenceDatesForOffenders.mockResolvedValue(sentenceDates)

    formService.getSecurityReferredOffenders.mockImplementation(() => [
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
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle an empty response', async () => {
    const uncategorised = []
    const expected = []

    nomisClient.getUncategorisedOffenders.mockResolvedValue(uncategorised)

    const result = await service.getReferredOffenders(context, mockTransactionalClient)
    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
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
  test('when supported cat in nomis', () => {
    expect(service.requiredCatType(BOOKING_ID, 'B', history('B'))).toBe('RECAT')
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
      ])
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
      ])
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
      ])
    ).toBe('INITIAL')
  })
})

describe('pnomisOrInconsistentWarning', () => {
  test('should return true for nomis status is P but not locally FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'STARTED' }, 'P')
    expect(result.pnomis).toBe(true)
    expect(result.requiresWarning).toBe(true)
  })

  test('should return true for nomis status is A with local status AWAITING_APPROVAL FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'AWAITING_APPROVAL' }, 'A')
    expect(result.pnomis).toBe(true)
    expect(result.requiresWarning).toBe(true)
  })

  test('should return false for nomis status is A with local status STARTED FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'STARTED' }, 'A')
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is A with local status SECURITY_AUTO FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SECURITY_AUTO' }, 'A')
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SUPERVISOR_BACK FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SUPERVISOR_BACK' }, 'P')
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SECURITY_BACK FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SECURITY_BACK' }, 'P')
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SECURITY_MANUAL FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SECURITY_MANUAL' }, 'P')
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return false for nomis status is P and local status is SUPERVISOR_BACK FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'SUPERVISOR_BACK' }, 'P')
    expect(result.pnomis).toBe(false)
    expect(result.requiresWarning).toBe(false)
  })

  test('should return true for nomis status is P (without warning) but not locally FOR RECAT', async () => {
    const result = service.pnomisOrInconsistentWarning({ status: 'APPROVED' }, 'A')
    expect(result.pnomis).toBe(false)
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
      { bookingId: -45, sequence: 1, nomisSeq: 10, catType: 'INITIAL', status: Status.APPROVED.name },
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
      mockTransactionalClient
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
      mockTransactionalClient
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
      mockTransactionalClient
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
      ]
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
      ]
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
      []
    )
    expect(result).toMatchObject([
      { bookingId: 1, name: 'first1' },
      { bookingId: 2, name: 'first2' },
    ])
  })
  test('mergeOffenderLists - ignore nulls', () => {
    const result = service.mergeOffenderLists(
      [{ bookingId: 1, name: 'first1' }, null],
      [null, { bookingId: 4, name: 'first2' }]
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
    formService.updateOffenderIdentifierReturningBookingId.mockResolvedValue([{ booking_id: 456 }])
    formService.getCategorisationRecord.mockResolvedValue({ status: Status.APPROVED.name })

    await service.checkAndMergeOffenderNo(context, 123, mockTransactionalClient)

    expect(nomisClient.getBasicOffenderDetails).toBeCalledWith(123)
    expect(nomisClient.getIdentifiersByBookingId).toBeCalledWith(123)
    expect(formService.updateOffenderIdentifierReturningBookingId).toBeCalledWith(
      'G123OLD',
      'G123NEW',
      mockTransactionalClient
    )
    expect(formService.getCategorisationRecord).toBeCalledWith(456, mockTransactionalClient)
    expect(nomisClient.setInactive).not.toBeCalled()
  })

  test('single merge with cat record pending', async () => {
    nomisClient.getBasicOffenderDetails.mockResolvedValue({ offenderNo: 'G123NEW' })
    nomisClient.getIdentifiersByBookingId.mockResolvedValue(realisticData)
    formService.updateOffenderIdentifierReturningBookingId.mockResolvedValue([{ booking_id: 456 }])
    formService.getCategorisationRecord.mockResolvedValue({ status: Status.AWAITING_APPROVAL.name })

    await service.checkAndMergeOffenderNo(context, 123, mockTransactionalClient)

    expect(nomisClient.getBasicOffenderDetails).toBeCalledWith(123)
    expect(nomisClient.getIdentifiersByBookingId).toBeCalledWith(123)
    expect(formService.updateOffenderIdentifierReturningBookingId).toBeCalledWith(
      'G123OLD',
      'G123NEW',
      mockTransactionalClient
    )
    expect(formService.getCategorisationRecord).toBeCalledWith(456, mockTransactionalClient)
    expect(nomisClient.setInactive).toBeCalledWith(456, 'ACTIVE')
  })
})
