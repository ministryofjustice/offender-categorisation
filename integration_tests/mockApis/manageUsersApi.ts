import { SuperAgentRequest } from 'superagent'
import { CASELOAD, Caseload } from '../factory/caseload'
import { UserAccount } from '../factory/user'
import { stubFor } from './wiremock'

const stubGetUser = ({ user }: { user: UserAccount }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: '/manage-users-api/users/me',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: {
        username: user.username,
        active: true,
        name: `${user.staffMember.firstName} ${user.staffMember.lastName}`,
        authSource: 'nomis',
        userId: `${user.staffMember.id}`,
      },
    },
  })

const stubGetUserByUsername = ({ user }: { user: UserAccount }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/manage-users-api/users/${user.username}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: {
        username: user.username,
        active: true,
        name: `${user.staffMember.firstName} ${user.staffMember.lastName}`,
        authSource: 'nomis',
        userId: `${user.staffMember.id}`,
      },
    },
  })

const stubGetUserCaseload = (
  { user, caseloads }: { user?: UserAccount; caseloads?: Caseload[] } = { caseloads: [CASELOAD.LEI] },
): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: '/manage-users-api/users/me/caseloads',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: {
        username: user?.username,
        activeCaseload: user?.workingCaseload?.id ?? caseloads[0]?.id,
        caseloads: caseloads.map(caseload => ({
          id: caseload.id,
          name: caseload.description,
          function: 'DUMMY',
        })),
      },
    },
  })

const stubGetUsersByUsername = ({ usernames } = { usernames: [] }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'POST',
      url: '/manage-users-api/prisonusers/find-by-usernames',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        usernames.map(username => ({
          staffId: 123,
          username,
          name: `lastName_${username}, firstName_${username}`,
          email: 'itaguser@syscon.net',
          activeCaseLoadId: 'LEI',
        })),
      ),
    },
  })

export default {
  stubGetUser,
  stubGetUserByUsername,
  stubGetUserCaseload,
  stubGetUsersByUsername,
}
