import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { UserAccount } from '../factory/user'

export default {
  stubElite2Ping: (statusCode = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/elite2/ping`,
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
  stubGetMyDetails: (user: UserAccount, caseloadId: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: '/elite2/api/users/me',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId: user.staffMember.id,
          username: user.username,
          firstName: user.staffMember.firstName,
          lastName: user.staffMember.lastName,
          email: 'itaguser@syscon.net',
          activeCaseLoadId: caseloadId,
        }),
      },
    }),
}
