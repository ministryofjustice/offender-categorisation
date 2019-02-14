const serviceCreator = require('../../server/services/offendersService')
const moment = require('moment')

const nomisClient = {
  getUncategorisedOffenders: jest.fn(),
  getSentenceDatesForOffenders: jest.fn(),
  getUserByUserId: jest.fn(),
  getOffenderDetails: jest.fn(),
  getSentenceDetails: jest.fn(),
  getSentenceTerms: jest.fn(),
  getMainOffence: jest.fn(),
}

const formService = {
  getCategorisationRecord: jest.fn(),
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
  nomisClient.getSentenceDetails.mockReset()
  nomisClient.getSentenceTerms.mockReset()
  nomisClient.getMainOffence.mockReset()
  formService.getCategorisationRecord.mockReset()
})

function todaySubtract(days) {
  return moment()
    .subtract(days, 'day')
    .format('YYYY-MM-DD')
}

describe('getUncategorisedOffenders', () => {
  test('it should return a list of offenders and sentence information', async () => {
    const uncategorised = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: 'UNCATEGORISED',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        status: 'UNCATEGORISED',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 122,
        status: 'AWAITING_APPROVAL',
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
        status: 'UNCATEGORISED',
        displayStatus: 'Not categorised',
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
        status: 'UNCATEGORISED',
        displayStatus: 'Not categorised',
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
        status: 'AWAITING_APPROVAL',
        displayStatus: 'Awaiting approval',
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
        status: 'UNCATEGORISED',
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

  // TODO determine error handling stategy
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

describe('getReferredOffenders', () => {
  test('it should return a list of offenders and sentence information', async () => {
    const uncategorised = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: 'UNCATEGORISED',
      },
      {
        offenderNo: 'H12345',
        firstName: 'Danny',
        lastName: 'Doyle',
        bookingId: 111,
        status: 'UNCATEGORISED',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 122,
        status: 'UNCATEGORISED',
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

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)

    nomisClient.getUserByUserId.mockImplementation(staffId => {
      switch (staffId) {
        case 'JSMITH':
          return {
            staffId,
            username: 'DEMO_USER1',
            firstName: 'John',
            lastName: 'Smith',
          }
        case 'BMAY':
          return {
            staffId,
            username: 'DEMO_USER2',
            firstName: 'Brian',
            lastName: 'May',
          }
        default:
          return null
      }
    })

    formService.getCategorisationRecord.mockImplementation(bookingId => {
      switch (bookingId) {
        case 123:
          return {
            id: -1,
            user_id: 'me',
            status: 'SECURITY',
            form_response: '',
            // assigned_user_id not present
            referred_date: '2019-02-04',
            referred_by: 'JSMITH',
          }
        case 111:
          return {
            id: -2,
            user_id: 'me',
            status: 'other',
            form_response: '',
          }
        case 122:
          return {
            id: -3,
            user_id: 'me',
            status: 'SECURITY',
            form_response: '',
            referred_date: '2019-02-04',
            referred_by: 'BMAY',
          }
        default:
          return {}
      }
    })

    const DATE_MATCHER = '\\d{2}/\\d{2}/\\d{4}'
    const expected = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        daysSinceSentence: 4,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        referredBy: 'John Smith',
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        bookingId: 122,
        daysSinceSentence: 10,
        dateRequired: expect.stringMatching(DATE_MATCHER),
        referredBy: 'Brian May',
      },
    ]

    const result = await service.getReferredOffenders('user1', 'agency')

    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(formService.getCategorisationRecord).toBeCalledTimes(3)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toMatchObject(expected)
  })

  test('it should handle an empty response', async () => {
    const uncategorised = []
    const expected = []

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)

    const result = await service.getReferredOffenders('user1', 'MDI')
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })

  test('it should not return offenders without sentence data', async () => {
    const uncategorised = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        bookingId: 123,
        status: 'UNCATEGORISED',
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

    const result = await service.getReferredOffenders('user1', 'MDI')
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })
})

describe('getOffenderDetails should format sentence length correctly', () => {
  test.each`
    apiData                                       | expectedContent
    ${{ years: 2, months: 4 }}                    | ${'2 years, 4 months'}
    ${{ months: 2, weeks: 4 }}                    | ${'2 months, 4 weeks'}
    ${{ days: 4 }}                                | ${'4 days'}
    ${{ years: 1, months: 1 }}                    | ${'1 year, 1 month'}
    ${{ weeks: 1 }}                               | ${'1 week'}
    ${{ weeks: 2, days: 4, years: null }}         | ${'2 weeks, 4 days'}
    ${{ years: 5, months: 6, weeks: 7, days: 1 }} | ${'5 years, 6 months, 7 weeks, 1 day'}
    ${{ years: 5, lifeSentence: true }}           | ${'Life'}
  `('should render $expectedContent for $apiData', async ({ apiData, expectedContent }) => {
    nomisClient.getOffenderDetails.mockReturnValue({ firstName: 'SAM', lastName: 'SMITH' })
    nomisClient.getSentenceTerms.mockReturnValue(apiData)
    const result = await service.getOffenderDetails('token', -5)
    expect(result.sentence.length).toEqual(expectedContent)
  })
})
