import { SuperAgentRequest } from 'superagent'
import moment from 'moment'
import { stubFor } from './wiremock'

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

const stubGetPrisonerSearchPrisoners = (
  {
    agencyId = 'LEI',
    content,
  }: {
    agencyId: string
    content: {
      bookingId: string
      prisonerNumber: string
      firstName: string
      lastName: string
      dateOfBirth: string
      category: string
    }[]
  } = { agencyId: 'LEI', content: [] },
): SuperAgentRequest => {
  const datePattern = `\\d{4}-\\d{2}-\\d{2}`
  return stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prisoner-search/prison/${agencyId}/prisoners\\?size=1000000&fromDob=${datePattern}&toDob=${datePattern}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        content,
      },
    },
  })
}

const stubGetPrisonerSearchPrisonersWomen = (
  {
    dateOfBirths = [],
    agencyId = 'PFI',
  }: {
    dateOfBirths: string[]
    agencyId: string
  } = { dateOfBirths: [], agencyId: 'PFI' },
): SuperAgentRequest => {
  const fromDob = moment().subtract(22, 'years').format('yyyy-MM-DD')
  const toDob = moment().subtract(21, 'years').add(2, 'months').format('yyyy-MM-DD')

  return stubFor({
    request: {
      method: 'GET',
      url: `/prisoner-search/prison/${agencyId}/prisoners?size=1000000&fromDob=${fromDob}&toDob=${toDob}`,
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
            dateOfBirth: dateOfBirths[0] ?? moment().subtract(3, 'days').subtract(21, 'years').format('yyyy-MM-DD'),
            category: 'I',
          },
          {
            bookingId: '22',
            prisonerNumber: 'C0002AA',
            firstName: 'ADRIAN',
            lastName: 'MOLE',
            // beware leap-years, when today + 17 days - 21 years DIFFERS from today - 21 years + 17 days (by one day!)
            dateOfBirth: dateOfBirths[1] ?? moment().add(17, 'days').subtract(21, 'years').format('yyyy-MM-DD'),
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
  releaseDates = [],
  status = [],
  legalStatus = [],
}: {
  offenderNumbers: OffenderNumber[]
  bookingIds: BookingId[]
  startDates: Date
  emptyResponse: boolean
  releaseDates: string[]
  status: string[]
  legalStatus: string[]
}): SuperAgentRequest => {
  let index = 0
  const response: SentenceData[] = emptyResponse
    ? []
    : offenderNumbers.map((offenderNumber, idx) => ({
        prisonerNumber: offenderNumber,
        bookingId: bookingIds[index].toString(),
        sentenceStartDate: startDates[idx],
        releaseDate: releaseDates[idx]
          ? moment(releaseDates[idx]).toISOString()
          : moment().add(1, 'days').toISOString(),
        firstName: `firstName-${index}`,
        // eslint-disable-next-line no-plusplus
        lastName: `lastName-${index++}`,
        offenceCode: `OFF${offenderNumber}`,
        statuteCode: `ST${offenderNumber}`,
        mostSeriousOffence: 'Robbery',
        status: status[idx] ? status[idx] : 'ACTIVE IN',
        legalStatus: legalStatus[idx] ? legalStatus[idx] : 'SENTENCED',
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
      url: '/prisoner-search/prisoner-search/booking-ids',
    },
    response: {
      status: 500,
      body: 'A test error',
    },
  })

export default {
  stubGetPrisonerSearchPrisoners,
  stubGetPrisonerSearchPrisonersWomen,
  stubPrisonerSearchPing,
  stubSentenceData,
  stubSentenceDataError,
}
