const moment = require('moment')
const serviceCreator = require('../../server/services/offendersService')
const Status = require('../../server/utils/statusEnum')
const ReviewReason = require('../../server/utils/reviewReasonEnum')

const DATE_MATCHER = '\\d{2}/\\d{2}/\\d{4}'
const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

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
  createInitialCategorisation: jest.fn(),
  createSupervisorApproval: jest.fn(),
  getCategory: jest.fn(),
  getCategoryHistory: jest.fn(),
  getAgencyDetail: jest.fn(),
  getCategorisedOffenders: jest.fn(),
  getLatestCategorisationForOffenders: jest.fn(),
}

const formService = {
  getCategorisationRecord: jest.fn(),
  getSecurityReferredOffenders: jest.fn(),
  getCategorisedOffenders: jest.fn(),
}

const nomisClientBuilder = () => nomisClient

let service

beforeEach(() => {
  service = serviceCreator(nomisClientBuilder, formService)
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
  nomisClient.createInitialCategorisation.mockReset()
  nomisClient.createSupervisorApproval.mockReset()
  formService.getCategorisationRecord.mockReset()
  formService.getSecurityReferredOffenders.mockReset()
  formService.getCategorisedOffenders.mockReset()
  nomisClient.getCategoryHistory.mockReset()
  nomisClient.getAgencyDetail.mockReset()
  nomisClient.getCategorisedOffenders.mockReset()
  nomisClient.getLatestCategorisationForOffenders.mockReset()
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
    const data = [
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
      {
        bookingId: 21,
        assessStatus: 'A',
      },
      {
        bookingId: 22,
        assessStatus: 'A',
      },
      {
        bookingId: 23,
        assessStatus: 'A',
      },
    ]

    const expected = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        displayName: 'Brown, Jane',
        bookingId: 123,
        displayStatus: Status.SECURITY_MANUAL.value,
        nextReviewDateDisplay: '20/04/2019',
        reason: ReviewReason.DUE,
        overdue: true,
      },
      {
        offenderNo: 'U2101AA',
        firstName: 'PETER',
        lastName: 'PAN',
        displayName: 'Pan, Peter',
        bookingId: 21,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '01/05/2019',
        reason: ReviewReason.AGE,
        overdue: true,
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        displayName: 'Doyle, Danny',
        bookingId: 111,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '21/05/2019',
        reason: ReviewReason.DUE,
        overdue: true,
      },
      {
        offenderNo: 'U2102AA',
        firstName: 'JUSTIN',
        lastName: 'BEIBER',
        displayName: 'Beiber, Justin',
        bookingId: 22,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '01/06/2019',
        reason: ReviewReason.AGE,
        overdue: false,
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        displayName: 'Allen, Alan',
        bookingId: 122,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '22/06/2019',
        reason: ReviewReason.DUE,
        overdue: false,
      },
    ]
    nomisClient.getRecategoriseOffenders.mockReturnValue(data)
    nomisClient.getPrisonersAtLocation.mockReturnValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockReturnValue(u21CatData)
    formService.getCategorisationRecord.mockReturnValue({}).mockReturnValueOnce({
      bookingId: 123,
      status: Status.SECURITY_MANUAL.name,
    })

    const result = await service.getRecategoriseOffenders('token', 'LEI', 'user1', mockTransactionalClient)

    expect(nomisClient.getRecategoriseOffenders.mock.calls[0][0]).toEqual('LEI')
    expect(nomisClient.getPrisonersAtLocation).toBeCalled()
    expect(formService.getCategorisationRecord).toBeCalledTimes(5)
    expect(formService.getCategorisationRecord).nthCalledWith(1, 123, mockTransactionalClient)
    expect(result).toMatchObject(expected)
  })

  test('No results from elite', async () => {
    nomisClient.getRecategoriseOffenders.mockReturnValue([])
    nomisClient.getPrisonersAtLocation.mockReturnValue([])
    const result = await service.getRecategoriseOffenders('token', 'LEI', 'user1', mockTransactionalClient)
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
      .mockReturnValueOnce({
        bookingId: 123,
        status: Status.SECURITY_BACK.name,
        catType: 'INITIAL',
      })
      .mockReturnValueOnce({
        bookingId: 21,
        status: Status.STARTED.name,
        catType: 'INITIAL',
      })
    nomisClient.getRecategoriseOffenders.mockReturnValue(data)
    nomisClient.getPrisonersAtLocation.mockReturnValue(u21Data)
    nomisClient.getLatestCategorisationForOffenders.mockReturnValue(u21CatData)

    const result = await service.getRecategoriseOffenders('token', 'LEI', 'user1', mockTransactionalClient)

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
    ]

    nomisClient.getUncategorisedOffenders.mockReturnValue(data)

    formService.getCategorisationRecord
      .mockReturnValueOnce({ bookingId: 1, nomisSeq: 11, catType: 'INITIAL', status: Status.AWAITING_APPROVAL.name })
      .mockReturnValueOnce({ bookingId: 2, nomisSeq: 12, catType: 'RECAT', status: Status.APPROVED.name })
      .mockReturnValueOnce({ bookingId: 3, nomisSeq: 13, catType: 'RECAT', status: Status.AWAITING_APPROVAL.name })
      .mockReturnValueOnce({ bookingId: 5, nomisSeq: 15, catType: 'RECAT', status: Status.SUPERVISOR_BACK.name })
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ bookingId: 7, nomisSeq: 17, catType: 'RECAT', status: Status.AWAITING_APPROVAL.name })

    const sentenceDates = [
      { sentenceDetail: { bookingId: 1, sentenceStartDate: mockTodaySubtract(30) } }, // 2019-05-01
      { sentenceDetail: { bookingId: 6, sentenceStartDate: mockTodaySubtract(18) } }, // 2019-05-13
    ]
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)

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

    const result = await service.getUnapprovedOffenders('token', 'LEI', mockTransactionalClient)

    expect(nomisClient.getUncategorisedOffenders.mock.calls[0][0]).toEqual('LEI')
    expect(formService.getCategorisationRecord).toBeCalledTimes(6)
    expect(formService.getCategorisationRecord).nthCalledWith(1, 1, mockTransactionalClient)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledWith([1, 6])
    expect(result).toMatchObject(expected)
  })

  test('No results from elite', async () => {
    nomisClient.getUncategorisedOffenders.mockReturnValue([])
    const result = await service.getUnapprovedOffenders('token', 'LEI', mockTransactionalClient)
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

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)
    formService.getCategorisationRecord.mockReturnValue({})

    const result = await service.getUncategorisedOffenders('user1')

    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle an empty response', async () => {
    const uncategorised = []
    const expected = []

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)

    const result = await service.getUncategorisedOffenders('MDI')
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

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)
    formService.getCategorisationRecord.mockReturnValue({})

    const result = await service.getUncategorisedOffenders('MDI')
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })

  test('it should propagate an error response', async () => {
    nomisClient.getUncategorisedOffenders.mockImplementation(() => {
      throw new Error()
    })
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

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)
    formService.getCategorisationRecord.mockReturnValue({})

    const result = await service.getUncategorisedOffenders('user1', 'MDI')
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
    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)
    formService.getCategorisationRecord.mockReturnValue(dbRecord)

    const result = await service.getUncategorisedOffenders('user1', 'MDI')
    expect(result[0].pnomis).toBe(true)
  })
})

test('create categorisation should propagate error response', async () => {
  nomisClient.createInitialCategorisation.mockImplementation(() => {
    throw new Error('our Error')
  })

  try {
    await service.createInitialCategorisation({}, {}, {})
  } catch (s) {
    expect(s.message).toEqual('our Error')
  }
})

test('createSupervisorApproval should propagate error response', async () => {
  nomisClient.createSupervisorApproval.mockImplementation(() => {
    throw new Error('our Error')
  })

  try {
    await service.createSupervisorApproval({}, {}, {})
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
    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)
    formService.getCategorisationRecord.mockReturnValue(dbRecord)
    const result = await service.getUncategorisedOffenders('user1', 'MDI')
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
      formObject: '',
      securityReferredDate: '2019-02-04',
      securityReferredBy: 'BMAY',
      catType: 'INITIAL',
    },
  ]

  test('it should return a list of offenders and sentence information', async () => {
    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      },
      {
        sentenceDetail: { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) },
      },
      {
        sentenceDetail: { bookingId: 122, sentenceStartDate: mockTodaySubtract(10) },
      },
    ]

    nomisClient.getOffenderDetailList.mockReturnValue(offenderDetailList)
    nomisClient.getUserDetailList.mockReturnValue(userDetailsList)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)

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

    const result = await service.getReferredOffenders('user1', 'agency')

    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should not return offenders without a sentence (result of nomis change after referral', async () => {
    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123, sentenceStartDate: mockTodaySubtract(4) },
      },
      {
        sentenceDetail: { bookingId: 111, sentenceStartDate: mockTodaySubtract(7) },
      },
    ]

    nomisClient.getOffenderDetailList.mockReturnValue(offenderDetailList)
    nomisClient.getUserDetailList.mockReturnValue(userDetailsList)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)

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
        offenderNo: 'G9999',
        userId: 'me',
        status: Status.SECURITY_MANUAL.name,
        formObject: '',
        securityReferredDate: '2019-02-04',
        securityReferredBy: 'BMAY',
        catType: 'INITIAL',
      },
    ])

    const expected = [
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

    const result = await service.getReferredOffenders('user1', 'agency')

    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle an empty response', async () => {
    const uncategorised = []
    const expected = []

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)

    const result = await service.getReferredOffenders('user1', 'MDI')
    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })
})

describe('getOffenderDetails', () => {
  test('should assemble details correctly', async () => {
    const sentenceTerms = [{ years: 2, months: 4, lifeSentence: true }]
    nomisClient.getOffenderDetails.mockReturnValue({ firstName: 'SAM', lastName: 'SMITH' })
    nomisClient.getSentenceDetails.mockReturnValue({ dummyDetails: 'stuff' })
    nomisClient.getSentenceTerms.mockReturnValue(sentenceTerms)
    nomisClient.getMainOffence.mockReturnValue({ mainOffence: 'stuff' })

    const result = await service.getOffenderDetails('token', -5)

    expect(result).toEqual({
      sentence: { dummyDetails: 'stuff', list: sentenceTerms, indeterminate: true },
      offence: { mainOffence: 'stuff' },
      firstName: 'SAM',
      lastName: 'SMITH',
      displayName: 'Smith, Sam',
    })
  })
})

describe('isRecat', () => {
  test('it should return RECAT when supported cat in nomis', async () => {
    nomisClient.getCategory.mockReturnValue({ classificationCode: 'B' })
    const result = await service.isRecat('token', 12345)
    expect(result).toBe('RECAT')
  })

  test('it should return INITIAL when missing in nomis', async () => {
    nomisClient.getCategory.mockRejectedValue(new Error('404'))
    const result = await service.isRecat('token', 12345)
    expect(result).toBe('INITIAL')
  })

  test('it should return INITIAL when cat Z in nomis', async () => {
    nomisClient.getCategory.mockReturnValue({ classificationCode: 'Z' })
    const result = await service.isRecat('token', 12345)
    expect(result).toBe('INITIAL')
  })

  test('it should return null when cat A in nomis', async () => {
    nomisClient.getCategory.mockReturnValue({ classificationCode: 'A' })
    const result = await service.isRecat('token', 12345)
    expect(result).toBe(null)
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
      assessmentAgencyId: 'MDI',
      assessmentStatus: 'A',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2012-04-04',
      assessmentAgencyId: 'LEI',
      assessmentStatus: 'P',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'A',
      classification: 'Cat A',
      assessmentDate: '2010-02-04',
      assessmentAgencyId: 'LEI',
      assessmentStatus: 'I',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'B',
      classification: 'Cat B',
      assessmentDate: '2013-03-24',
      assessmentAgencyId: 'MDI',
      assessmentStatus: 'I',
    },
    {
      bookingId: -45,
      offenderNo: 'ABC1',
      classificationCode: 'B',
      classification: 'Cat B',
      assessmentDate: '2019-04-17',
      assessmentAgencyId: 'BXI',
      assessmentStatus: 'A',
    },
  ]

  test('it should return a list of historical categorisations, filtering out any pending and future categorisations, sorted by assessment date', async () => {
    nomisClient.getCategoryHistory.mockReturnValue(cats)
    nomisClient.getAgencyDetail.mockReturnValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2013-03-24',
        assessmentDateDisplay: '24/03/2013',
        assessmentAgencyId: 'MDI',
        agencyDescription: 'Moorlands',
        assessmentStatus: 'I',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        assessmentDate: '2012-04-04',
        assessmentDateDisplay: '04/04/2012',
        agencyDescription: 'Moorlands',
        assessmentStatus: 'A',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2010-02-04',
        assessmentAgencyId: 'LEI',
        assessmentStatus: 'I',
      },
    ]

    const result = await service.getPrisonerBackground('token', 'ABC1', moment('2019-04-16'))

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(3)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should return a list of historical categorisations, filtering out any pending categorisations, sorted by assessment date', async () => {
    nomisClient.getCategoryHistory.mockReturnValue(cats)
    nomisClient.getAgencyDetail.mockReturnValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2019-04-17',
        assessmentDateDisplay: '17/04/2019',
        assessmentAgencyId: 'BXI',
        agencyDescription: 'Moorlands',
        assessmentStatus: 'A',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2013-03-24',
        assessmentDateDisplay: '24/03/2013',
        assessmentAgencyId: 'MDI',
        agencyDescription: 'Moorlands',
        assessmentStatus: 'I',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        assessmentDate: '2012-04-04',
        assessmentDateDisplay: '04/04/2012',
        agencyDescription: 'Moorlands',
        assessmentStatus: 'A',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2010-02-04',
        assessmentAgencyId: 'LEI',
        assessmentStatus: 'I',
      },
    ]

    const result = await service.getPrisonerBackground('token', 'ABC1')

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(4)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle a missing assessment agency', async () => {
    nomisClient.getCategoryHistory.mockReturnValue([
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
      },
    ])
    nomisClient.getAgencyDetail.mockReturnValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        assessmentDate: '2012-04-04',
        assessmentDateDisplay: '04/04/2012',
        agencyDescription: '',
      },
    ]

    const result = await service.getPrisonerBackground('token', 'ABC1')

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(0)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
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
      nomisClient.getLatestCategorisationForOffenders.mockReturnValue(eliteU21Cats)
      const result = await service.mergeU21ResultWithNomisCategorisationData(nomisClient, 'LEI', u21Cats)

      expect(result).toMatchObject(expected)
    })
  })
})
