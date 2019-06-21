const serviceCreator = require('../../server/services/offendersService')
const moment = require('moment')
const Status = require('../../server/utils/statusEnum')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

const nomisClient = {
  getUncategorisedOffenders: jest.fn(),
  getSentenceDatesForOffenders: jest.fn(),
  getRecategoriseOffenders: jest.fn(),
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
}

const formService = {
  getCategorisationRecord: jest.fn(),
  getSecurityReferredOffenders: jest.fn(),
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
  nomisClient.getCategoryHistory.mockReset()
  nomisClient.getAgencyDetail.mockReset()
})

function todaySubtract(days) {
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
        nextReviewDate: '2019-06-20',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        category: 'B',
        nextReviewDate: '2019-06-21',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 122,
        category: 'B',
        nextReviewDate: '2019-06-22',
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
        nextReviewDate: '2019-06-20',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        displayName: 'Doyle, Danny',
        bookingId: 111,
        displayStatus: 'Not started',
        nextReviewDate: '2019-06-21',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        displayName: 'Allen, Alan',
        bookingId: 122,
        displayStatus: 'Not started',
        nextReviewDate: '2019-06-22',
      },
    ]
    nomisClient.getRecategoriseOffenders.mockReturnValue(data)
    formService.getCategorisationRecord.mockReturnValue({}).mockReturnValueOnce({
      bookingId: 123,
      status: Status.SECURITY_MANUAL.name,
    })

    const result = await service.getRecategoriseOffenders('token', 'LEI', 'user1', mockTransactionalClient)
    expect(nomisClient.getRecategoriseOffenders).toBeCalledWith('LEI')
    expect(formService.getCategorisationRecord).toBeCalledTimes(3)
    expect(formService.getCategorisationRecord).nthCalledWith(1, 123, mockTransactionalClient)
    expect(result).toMatchObject(expected)
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
      {
        sentenceDetail: { bookingId: 123, sentenceStartDate: todaySubtract(4) },
      },
      {
        sentenceDetail: { bookingId: 111, sentenceStartDate: todaySubtract(7) },
      },
      {
        sentenceDetail: { bookingId: 122, sentenceStartDate: todaySubtract(10) },
      },
    ]

    const DATE_MATCHER = '\\d{2}/\\d{2}/\\d{4}'
    const expected = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        displayName: 'Brown, Jane',
        bookingId: 123,
        status: Status.UNCATEGORISED.name,
        displayStatus: Status.UNCATEGORISED.value,
        sentenceDate: todaySubtract(4),
        daysSinceSentence: 4,
        dateRequired: expect.stringMatching(DATE_MATCHER),
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        displayName: 'Doyle, Danny',
        bookingId: 111,
        status: Status.UNCATEGORISED.name,
        displayStatus: Status.UNCATEGORISED.value,
        sentenceDate: todaySubtract(7),
        daysSinceSentence: 7,
        dateRequired: expect.stringMatching(DATE_MATCHER),
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        displayName: 'Allen, Alan',
        bookingId: 122,
        status: Status.AWAITING_APPROVAL.name,
        displayStatus: Status.AWAITING_APPROVAL.value,
        sentenceDate: todaySubtract(10),
        daysSinceSentence: 10,
        dateRequired: expect.stringMatching(DATE_MATCHER),
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
    })
  })

  test('it should calculate business days correctly when sentenceDate is Saturday', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-01-16', 'YYYY-MM-DD'))
    expect(service.buildSentenceData('2019-01-12')).toEqual({
      daysSinceSentence: 4,
      dateRequired: '28/01/2019',
      sentenceDate: '2019-01-12',
    })
  })

  test('it should calculate business days correctly when sentenceDate is Sunday', async () => {
    moment.now = jest.fn()
    moment.now.mockReturnValue(moment('2019-01-16', 'YYYY-MM-DD'))
    expect(service.buildSentenceData('2019-01-13')).toEqual({
      daysSinceSentence: 3,
      dateRequired: '28/01/2019',
      sentenceDate: '2019-01-13',
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
})

test('it should handle an empty response', async () => {
  const uncategorised = []
  const expected = []

  nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)

  const result = await service.getReferredOffenders('user1', 'MDI')
  expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
  expect(result).toEqual(expected)
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

describe('getReferredOffenders', () => {
  test('it should return a list of offenders and sentence information', async () => {
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

    const sentenceDates = [
      {
        sentenceDetail: { bookingId: 123, sentenceStartDate: todaySubtract(4) },
      },
      {
        sentenceDetail: { bookingId: 111, sentenceStartDate: todaySubtract(7) },
      },
      {
        sentenceDetail: { bookingId: 122, sentenceStartDate: todaySubtract(10) },
      },
    ]

    nomisClient.getOffenderDetailList.mockReturnValue(offenderDetailList)
    nomisClient.getUserDetailList.mockReturnValue(userDetailsList)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)

    formService.getSecurityReferredOffenders.mockImplementation(() => [
      {
        id: -1,
        bookingId: 123,
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
        userId: 'me',
        status: Status.SECURITY_MANUAL.name,
        formObject: '',
        securityReferredDate: '2019-02-04',
        securityReferredBy: 'BMAY',
        catType: 'INITIAL',
      },
    ])

    const DATE_MATCHER = '\\d{2}/\\d{2}/\\d{4}'
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
      {
        offenderNo: 'G55345',
        displayName: 'Allen, Alan',
        bookingId: 122,
        daysSinceSentence: 10,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        securityReferredBy: 'Brian May',
        catTypeDisplay: 'Initial',
      },
    ]

    const result = await service.getReferredOffenders('user1', 'agency')

    expect(formService.getSecurityReferredOffenders).toBeCalledTimes(1)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
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
  test('it should return true when local and approved', async () => {
    formService.getCategorisationRecord.mockReturnValue({ status: Status.APPROVED.name })
    const result = await service.isRecat('token', 12345, mockTransactionalClient)
    expect(result).toBe(true)
  })

  test('it should return false when local, not approved and initial', async () => {
    formService.getCategorisationRecord.mockReturnValue({ status: Status.STARTED.name, catType: 'INITIAL' })
    const result = await service.isRecat('token', 12345, mockTransactionalClient)
    expect(result).toBe(false)
  })

  test('it should return true when local, not approved and recat', async () => {
    formService.getCategorisationRecord.mockReturnValue({ status: Status.STARTED.name, catType: 'RECAT' })
    const result = await service.isRecat('token', 12345, mockTransactionalClient)
    expect(result).toBe(true)
  })

  test('it should return true when not local and cat in nomis', async () => {
    formService.getCategorisationRecord.mockReturnValue({})
    nomisClient.getCategory.mockReturnValue({ classificationCode: 'B' })
    const result = await service.isRecat('token', 12345, mockTransactionalClient)
    expect(result).toBe(true)
  })

  test('it should return false when not local and missing in nomis', async () => {
    formService.getCategorisationRecord.mockReturnValue({})
    nomisClient.getCategory.mockRejectedValue(new Error('404'))
    const result = await service.isRecat('token', 12345, mockTransactionalClient)
    expect(result).toBe(false)
  })

  test('it should return false when not local and cat Z in nomis', async () => {
    formService.getCategorisationRecord.mockReturnValue({})
    nomisClient.getCategory.mockReturnValue({ classificationCode: 'Z' })
    const result = await service.isRecat('token', 12345, mockTransactionalClient)
    expect(result).toBe(false)
  })
})

describe('getPrisonerBackground', () => {
  test('it should return a list of historical categorisations', async () => {
    const cats = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
        assessmentAgencyId: 'MDI',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2013-03-24',
        assessmentAgencyId: 'MDI',
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(cats)
    nomisClient.getAgencyDetail.mockReturnValue({ description: 'Moorlands' })

    const expected = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        assessmentDate: '2012-04-04',
        assessmentDateDisplay: '04/04/2012',
        agencyDescription: 'Moorlands',
      },
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'B',
        assessmentDate: '2013-03-24',
        assessmentDateDisplay: '24/03/2013',
        assessmentAgencyId: 'MDI',
        agencyDescription: 'Moorlands',
      },
    ]

    const result = await service.getPrisonerBackground('token', 'ABC1')

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(2)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle a missing assessment agency', async () => {
    const cats = [
      {
        bookingId: -45,
        offenderNo: 'ABC1',
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(cats)
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
