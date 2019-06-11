const config = require('../config')
const querystring = require('querystring')
const { getNamespace } = require('cls-hooked')
const logger = require('../../log')
const superagent = require('superagent')

module.exports = {
  generateOauthClientToken,
  getApiClientToken,
}

const oauthUrl = `${config.apis.oauth2.url}/oauth/token`
const timeoutSpec = {
  response: config.apis.riskProfiler.timeout.response,
  deadline: config.apis.riskProfiler.timeout.deadline,
}

function generateOauthClientToken(
  clientId = config.apis.oauth2.apiClientId,
  clientSecret = config.apis.oauth2.apiClientSecret
) {
  return generate(clientId, clientSecret)
}

function generate(clientId, clientSecret) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}

async function getApiClientToken() {
  const oauthRiskProfilerClientToken = generateOauthClientToken()
  const handle = getNamespace('page.scope')
  const username = handle.get('user')
  const correlationId = handle.get('correlationId')
  const oauthRequest = querystring.stringify({ grant_type: 'client_credentials', username })

  logger.info(
    `Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.apiClientId}' and user '${username}'`
  )

  return superagent
    .post(oauthUrl)
    .set('Authorization', oauthRiskProfilerClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .set('correlationId', correlationId)
    .send(oauthRequest)
    .timeout(timeoutSpec)
}
