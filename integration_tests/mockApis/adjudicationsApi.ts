import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const stubAdjudicationHearings = ({
  bookingId,
  fromDate,
}: {
  bookingId: number
  fromDate: string
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'POST',
      url: `/adjudications-api/adjudications/by-booking-id/${bookingId}&adjudicationCutoffDate=${fromDate}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [],
    },
  })

const stubAdjudicationsApiPing = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/adjudications-api/health/ping`,
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

export default {
  stubAdjudicationHearings,
  stubAdjudicationsApiPing,
}
