const superagent = require('superagent')
const querystring = require('querystring')
const log = require('../../log')
const fiveMinutesBefore = require('../utils/fiveMinutesBefore')
const { generateOauthClientToken } = require('./clientCredentials')
const config = require('../config')

function signInService() {
  return {
    getUser(token, refreshToken, expiresIn, username) {
      log.info(`User profile for: ${username}`)

      return {
        token,
        refreshToken,
        refreshTime: fiveMinutesBefore(expiresIn),
        username,
      }
    },

    async getRefreshedToken(user) {
      log.info(`Refreshing token for : ${user.username}`)
      const { token, refreshToken, expiresIn } = await getRefreshTokens(user.username, user.role, user.refreshToken)
      const refreshTime = fiveMinutesBefore(expiresIn)
      return { token, refreshToken, refreshTime }
    },
  }

  async function getRefreshTokens(username, role, refreshToken) {
    const oauthClientToken = generateOauthClientToken()
    const oauthRequest = { grant_type: 'refresh_token', refresh_token: refreshToken }

    return oauthTokenRequest(oauthClientToken, oauthRequest)
  }
}

async function oauthTokenRequest(clientToken, oauthRequest) {
  const oauthResult = await getOauthToken(clientToken, oauthRequest)
  log.info(`Oauth request for grant type '${oauthRequest.grant_type}', result status: ${oauthResult.status}`)

  return parseOauthTokens(oauthResult)
}

function getOauthToken(oauthClientToken, requestSpec) {
  const oauthRequest = querystring.stringify(requestSpec)

  return superagent
    .post(`${config.apis.oauth2.url}/oauth/token`)
    .set('Authorization', oauthClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(config.apis.oauth2.timeout)
}

function parseOauthTokens(oauthResult) {
  const token = oauthResult.body.access_token
  const refreshToken = oauthResult.body.refresh_token
  const expiresIn = oauthResult.body.expires_in

  return { token, refreshToken, expiresIn }
}

module.exports = signInService
