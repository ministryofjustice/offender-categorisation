const querystring = require('querystring')
const superagent = require('superagent')
const redis = require('redis')
// const { promisify } = require('util')
const logger = require('../../log')
const { config } = require('../config')

module.exports = {
  generateOauthClientToken,
  getApiClientToken,
}

const client = redis.createClient({
  port: config.redis.port,
  password: config.redis.auth_token,
  host: config.redis.host,
  tls: config.redis.tls_enabled === 'true' ? {} : false,
  prefix: 'clientToken:',
})

client.on('error', error => {
  logger.error(error, `Redis error`)
})

// const getRedisAsync = promisify(client.get).bind(client)
// const setRedisAsync = promisify(client.set).bind(client)

const oauthUrl = `${config.apis.oauth2.url}/oauth/token`
const timeoutSpec = {
  response: config.apis.riskProfiler.timeout.response,
  deadline: config.apis.riskProfiler.timeout.deadline,
}

function generateOauthClientToken(
  clientId = config.apis.oauth2.authCodeClientId,
  clientSecret = config.apis.oauth2.authCodeClientSecret,
) {
  if (config.featureFlags.auth.useNewAuth) {
    return generate(clientId, clientSecret)
  }

  return generate(config.apis.oauth2.apiClientId, config.apis.oauth2.apiClientSecret)
}

function generate(clientId, clientSecret) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}

function generateSystemClientToken(
  clientId = config.apis.oauth2.clientCredsClientId,
  clientSecret = config.apis.oauth2.clientCredsClientSecret,
) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}

async function getApiClientToken(username) {
  // const redisKey = username || '%ANONYMOUS%'
  // const tokenFromRedis = await getRedisAsync(redisKey)
  // if (tokenFromRedis) {
  //   return { body: { access_token: tokenFromRedis } }
  // }

  let catClientToken

  if (config.featureFlags.auth.useNewAuth) {
    catClientToken = generateSystemClientToken()
  } else {
    catClientToken = generateOauthClientToken()
  }

  const oauthRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  const clientIdInUse = config.featureFlags.auth.useNewAuth
    ? config.apis.oauth2.clientCredsClientId
    : config.apis.oauth2.apiClientId

  logger.info(`Oauth request '${oauthRequest}' for client id '${clientIdInUse}' and user '${username}'`)

  const newToken = await superagent
    .post(oauthUrl)
    .set('Authorization', catClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec)

  // set TTL slightly less than expiry of token
  // await setRedisAsync(redisKey, newToken.body.access_token, 'EX', newToken.body.expires_in - 60)

  return newToken
}
