import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubAllocationManagerHealth: (statusCode = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/allocation-manager/health`,
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
  stubGetPomByOffenderNo: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/allocation/\\w+',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          primary_pom: { name: 'Humperdinck, Engelbert', staff_id: 12345 },
          secondary_pom: { name: 'Depp, Johnny', staff_id: 6789 },
        },
      },
    }),
}
