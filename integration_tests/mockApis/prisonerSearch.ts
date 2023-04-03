import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

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
}
