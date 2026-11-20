const querystring = require('querystring')
const superagent = require('superagent')
const redis = require('redis')
const logger = require('../../log')
const { config } = require('../config')

module.exports = {
  generateOauthClientToken,
  getApiClientToken,
}

const KEY_PREFIX = 'clientToken:'

const client = redis.createClient({
  password: config.redis.auth_token,
  socket: {
    host: config.redis.host,
    port: Number(config.redis.port),
    tls: config.redis.tls_enabled === 'true',
  },
})

client.on('error', error => {
  logger.error(error, `Redis error`)
})

client.connect().catch(error => logger.error(error, `Error connecting to Redis`))

const oauthUrl = `${config.apis.oauth2.url}/oauth/token`

const timeoutSpec = {
  response: config.apis.oauth2.timeout.response,
  deadline: config.apis.oauth2.timeout.deadline,
}

function generateOauthClientToken(
  clientId = config.apis.oauth2.authCodeClientId,
  clientSecret = config.apis.oauth2.authCodeClientSecret,
) {
  return generate(clientId, clientSecret)
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
  const redisKey = `${KEY_PREFIX}${username || '%ANONYMOUS%'}`
  const tokenFromRedis = await client.get(redisKey)
  if (tokenFromRedis) {
    return { body: { access_token: tokenFromRedis } }
  }

  const oauthClientToken = generateSystemClientToken()

  const oauthRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  logger.debug(
    `Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.clientCredsClientId}' and user '${username}'`,
  )

  const newToken = await superagent
    .post(oauthUrl)
    .set('Authorization', oauthClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec)

  // set TTL slightly less than expiry of token
  await client.set(redisKey, newToken.body.access_token, { EX: newToken.body.expires_in - 60 })

  return newToken
}
