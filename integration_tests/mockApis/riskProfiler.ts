import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const stubRiskProfilerPing = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/ping`,
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
  stubRiskProfilerPing,
}
