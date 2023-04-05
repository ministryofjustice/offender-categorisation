import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubVerifyToken: (active = true): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/verification/token/verify',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { active },
      },
    }),
}
