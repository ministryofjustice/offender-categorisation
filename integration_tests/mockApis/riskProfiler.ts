import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubRiskProfilerPing: (statusCode = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/risk-profiler/ping`,
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
