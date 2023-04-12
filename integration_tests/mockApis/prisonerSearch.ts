import { SuperAgentRequest } from 'superagent'
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

export default {
  stubPrisonerSearchPing: (statusCode = 200): SuperAgentRequest =>
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
    }),
  stubSentenceData: ({
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
        url: '/prisoner-search/booking-ids',
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
  },
}
