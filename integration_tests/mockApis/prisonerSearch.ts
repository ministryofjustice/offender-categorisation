import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import moment from 'moment'

type OffenderNumber = string
type BookingId = number

interface SentenceData {
  prisonerNumber: string
  bookingId: string
  sentenceStartDate: string
  releaseDate: string
  firstName: string
  lastName: string
  offenceCode: string
  statuteCode: string
  mostSeriousOffence: string
}

const stubGetPrisonerSearchPrisonersWomen = (
  {
    dateOfBirths = [],
    agencyId = 'PFI',
  }: {
    dateOfBirths: string[]
    agencyId: string
  } = { dateOfBirths: [], agencyId: 'PFI' }
): SuperAgentRequest => {
  const fromDob = moment().subtract(22, 'years')
  const toDob = moment().subtract(21, 'years').add(2, 'months')

  return stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prisoner-search/prison/${agencyId}/prisoners?size=1000000&fromDob=${fromDob}&toDob=${toDob}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        content: [
          {
            bookingId: '21',
            prisonerNumber: 'C0001AA',
            firstName: 'TINY',
            lastName: 'TIM',
            dateOfBirth: dateOfBirths[0] ?? moment().subtract(3, 'days').subtract(21, 'years').format('yyyy-MM-dd'),
            category: 'I',
          },
          {
            bookingId: '22',
            prisonerNumber: 'C0002AA',
            firstName: 'ADRIAN',
            lastName: 'MOLE',
            // beware leap-years, when today + 17 days - 21 years DIFFERS from today - 21 years + 17 days (by one day!)
            dateOfBirth: dateOfBirths[1] ?? moment().add(17, 'days').subtract(21, 'years').format('yyyy-MM-dd'),
            category: 'I',
          },
        ],
      },
    },
  })
}

const stubPrisonerSearchPing = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prisoner-search/health/ping`,
    },
    response: {
      status: statusCode,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        status: statusCode,
        response: {},
      },
    },
  })

const stubSentenceData = ({
  offenderNumbers,
  bookingIds,
  startDates,
  emptyResponse = false,
}: {
  offenderNumbers: OffenderNumber[]
  bookingIds: BookingId[]
  startDates: Date
  emptyResponse: boolean
}): SuperAgentRequest => {
  let index = 0
  const response: SentenceData[] = emptyResponse
    ? []
    : offenderNumbers.map(offenderNumber => ({
        prisonerNumber: offenderNumber,
        bookingId: bookingIds[index].toString(),
        sentenceStartDate: startDates[index],
        releaseDate: new Date().toISOString(),
        firstName: `firstName-${index}`,
        lastName: `lastName-${index++}`,
        offenceCode: `OFF${offenderNumber}`,
        statuteCode: `ST${offenderNumber}`,
        mostSeriousOffence: 'Robbery',
      }))

  return stubFor({
    request: {
      method: 'POST',
      url: '/prisoner-search/prisoner-search/booking-ids',
      bodyPatterns: [
        {
          equalToJson: JSON.stringify({ bookingIds }),
          ignoreArrayOrder: true,
          ignoreExtraElements: true,
        },
      ],
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    },
  })
}

const stubSentenceDataError = (): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/prisoner-search/prisoner-search/booking-ids',
    },
    response: {
      status: 500,
      body: 'A test error',
    },
  })

export default {
  stubGetPrisonerSearchPrisonersWomen,
  stubPrisonerSearchPing,
  stubSentenceData,
  stubSentenceDataError,
}
