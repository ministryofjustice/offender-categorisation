const serviceCreator = require('../../server/services/offendersService')
const moment = require('moment')

const nomisClient = {
  getUncategorisedOffenders: jest.fn(),
  getSentenceDatesForOffenders: jest.fn(),
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
})

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
        sentenceDetail: { bookingId: 123, sentenceStartDate: todaySubtract(6) },
      },
      {
        sentenceDetail: { bookingId: 111, sentenceStartDate: todaySubtract(7) },
      },
      {
        sentenceDetail: { bookingId: 122, sentenceStartDate: todaySubtract(9) },
      },
    ]

    const expected = [
      {
        offenderNo: 'G12345',
        firstName: 'Jane',
        lastName: 'Brown',
        displayName: 'Brown, Jane',
        bookingId: 123,
        status: 'UNCATEGORISED',
        displayStatus: 'Not categorised',
        sentenceDate: todaySubtract(6),
        daysSinceSentence: 6,
        dateRequired: todayAdd(4),
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
        dateRequired: todayAdd(3),
      },
      {
        offenderNo: 'G55345',
        firstName: 'Alan',
        lastName: 'Allen',
        displayName: 'Allen, Alan',
        bookingId: 122,
        status: 'AWAITING_APPROVAL',
        displayStatus: 'Awaiting approval',
        sentenceDate: todaySubtract(9),
        daysSinceSentence: 9,
        dateRequired: todayAdd(1),
      },
    ]

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)
    nomisClient.getSentenceDatesForOffenders.mockReturnValue(sentenceDates)
    formService.getCategorisationRecord.mockReturnValue({})

    const result = await service.getUncategorisedOffenders('user1')
    expect(nomisClient.getUncategorisedOffenders).toBeCalledTimes(1)
    expect(nomisClient.getSentenceDatesForOffenders).toBeCalledTimes(1)
    expect(result).toEqual(expected)
  })

  test('it should handle an empty response', async () => {
    const uncategorised = []
    const expected = []

    nomisClient.getUncategorisedOffenders.mockReturnValue(uncategorised)

    const result = await service.getUncategorisedOffenders('MDI')
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

  function todaySubtract(days) {
    return moment()
      .subtract(days, 'day')
      .format('YYYY-MM-DD')
  }

  function todayAdd(days) {
    return moment()
      .add(days, 'day')
      .format('YYYY-MM-DD')
  }
})
