import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const stubGetEscapeProfile = ({
  offenderNo,
  alertCode,
}: {
  offenderNo: string
  alertCode: string
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/alerts-api/prisoners/${offenderNo}/alerts?isActive=true&alertCode=XER,XEL,XELH`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        content: [
          {
            alertCode: {
              code: alertCode,
            },
            activeFrom: '2016-09-14',
          },
        ],
      },
    },
  })

const stubAlertsApiPing = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/alerts-api/health/ping`,
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
  stubGetEscapeProfile,
  stubAlertsApiPing,
}
