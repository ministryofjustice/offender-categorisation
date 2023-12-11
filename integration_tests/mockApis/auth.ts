import jwt from 'jsonwebtoken'
import { stubFor, getMatchingRequests, clearPreviousRequests } from './wiremock'
import { UserAccount } from '../factory/user'

type AccessToken = string

const createTokenForUser = ({ user }: { user: UserAccount }): AccessToken => {
  const payload = {
    user_name: user.username,
    scope: ['read'],
    auth_source: 'nomis',
    authorities: user.roles,
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

const getSignInUrl = (): Promise<string> =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/auth/oauth/authorize',
  }).then(data => {
    const { requests } = data.body

    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    return `/login/callback?code=codexxxx&state=${stateValue}`
  })

const favicon = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/favicon.ico',
    },
    response: {
      status: 200,
    },
  })

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/ping',
    },
    response: {
      status: 200,
    },
  })

const redirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/oauth/authorize\\?response_type=code&redirect_uri=.+?&state=.+?&client_id=clientid',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        Location: 'http://localhost:3007/login/callback?code=codexxxx&state=stateyyyy',
      },
      body: '<html><body>SignIn page<h1>Sign in</h1></body></html>',
    },
  })

const signOut = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/logout.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body>SignIn page<h1>Sign in</h1></body></html>',
    },
  })

const manageDetails = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/account-details.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body><h1>Your account details</h1></body></html>',
    },
  })

const stubUser = ({ user }: { user: UserAccount }) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/api/user/me',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        staffId: 231232,
        username: user.username,
        active: true,
        name: `${user.staffMember.firstName} ${user.staffMember.lastName}`,
      },
    },
  })

const stubUserRoles = ({ user }: { user: UserAccount }) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/api/user/me/roles',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: user.roles,
    },
  })

const stubTokenResponse = ({ user }: { user: UserAccount }) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Location: 'http://localhost:3007/login/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: createTokenForUser({ user }),
        refresh_token: createTokenForUser({ user }),
        token_type: 'bearer',
        user_name: user.username,
        expires_in: 599,
        scope: 'read write',
        internalUser: true,
      },
    },
  })

const stubValidOAuthTokenRequest = ({ user }: { user: UserAccount }) =>
  Promise.all([clearPreviousRequests(), redirect(), signOut(), favicon(), stubTokenResponse({ user })])

export default {
  getSignInUrl,
  manageDetails,
  stubAuthPing: ping,
  stubUser,
  stubUserRoles,
  stubValidOAuthTokenRequest,
}
