const serviceCreator = require('../../server/services/offendersService')
const moment = require('moment')
const Status = require('../../server/utils/statusEnum')

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
        nextReviewDate: '2019-04-20',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        category: 'C',
        nextReviewDate: '2019-05-21',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 122,
        category: 'D',
        nextReviewDate: '2019-06-22',
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

    const expected = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        displayName: 'Brown, Jane',
        bookingId: 123,
        displayStatus: Status.SECURITY_MANUAL.value,
        nextReviewDateDisplay: '20/04/2019',
        reason: 'Review due',
      },
      {
        offenderNo: 'U2101AA',
        firstName: 'PETER',
        lastName: 'PAN',
        displayName: 'Pan, Peter',
        bookingId: 21,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '01/05/2019',
        reason: 'Age 21',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        displayName: 'Doyle, Danny',
        bookingId: 111,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '21/05/2019',
        reason: 'Review due',
      },
      {
        offenderNo: 'U2102AA',
        firstName: 'JUSTIN',
        lastName: 'BEIBER',
        displayName: 'Beiber, Justin',
        bookingId: 22,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '01/06/2019',
        reason: 'Age 21',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        displayName: 'Allen, Alan',
        bookingId: 122,
        displayStatus: 'Not started',
        nextReviewDateDisplay: '22/06/2019',
        reason: 'Review due',
      },
    ]
    nomisClient.getRecategoriseOffenders.mockReturnValue(data)
    nomisClient.getPrisonersAtLocation.mockReturnValue(u21Data)
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

    const result = await service.getRecategoriseOffenders('token', 'LEI', 'user1', mockTransactionalClient)

    expect(result).toHaveLength(0)
    expect(formService.getCategorisationRecord).toBeCalledTimes(2)
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

describe('getPrisonerBackground', () => {
  test('it should return a list of historical categorisations, filtering out any pending categorisations, sorted by assessment date', async () => {
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
    ]

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

    const result = await service.getPrisonerBackground('token', 'ABC1')

    expect(nomisClient.getAgencyDetail).toBeCalledTimes(3)
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

describe('getMatchedCategorisations', () => {
  const eliteCats = [
    {
      offenderNo: 'B1234AB',
      bookingId: 10,
      assessmentDate: '2018-03-28',
      assessmentSeq: 1,
      category: 'C',
    },
    {
      offenderNo: 'B1234AB',
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
      offenderNo: 'B1234AB',
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
        offenderNo: 'ABC1',
        nomisSeq: 1,
      },
      {
        bookingId: 11,
        offenderNo: 'ABC1',
        nomisSeq: 1,
      },
    ]

    const expected = [
      {
        offenderNo: 'B1234AB',
        bookingId: 10,
        assessmentDate: '2018-03-28',
        assessmentSeq: 1,
        category: 'C',
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

  test("ignore returned results that don't match local booking ids - a can't happen in reality", async () => {
    const dbCats = [
      {
        bookingId: 6,
        offenderNo: 'ABC1',
        nomisSeq: 1,
      },
    ]

    const result = await service.getMatchedCategorisations(eliteCats, dbCats)

    expect(result).toHaveLength(0)
  })

  test('if no corresponding seq held locally, it should return the latest (by seq) categorisation', async () => {
    const dbCats = [
      {
        bookingId: 10,
        offenderNo: 'ABC1',
      },
      {
        bookingId: 11,
        offenderNo: 'ABC1',
      },
    ]

    const result = await service.getMatchedCategorisations(eliteCats, dbCats)

    const expected = [
      {
        offenderNo: 'B1234AB',
        bookingId: 11,
        assessmentDate: '2018-03-28',
        assessmentSeq: 2,
        category: 'I',
      },
      {
        offenderNo: 'B1234AB',
        bookingId: 10,
        assessmentDate: '2018-03-28',
        assessmentSeq: 3,
        category: 'B',
      },
    ]

    expect(result.sort()).toMatchObject(expected.sort())
  })
})
