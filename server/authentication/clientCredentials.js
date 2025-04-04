const querystring = require('querystring')
const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const redis = require('redis')
const { promisify } = require('util')
const logger = require('../../log')
const config = require('../config')

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

const getRedisAsync = promisify(client.get).bind(client)
const setRedisAsync = promisify(client.set).bind(client)

const oauthUrl = `${config.apis.oauth2.url}/oauth/token`
const timeoutSpec = {
  response: config.apis.riskProfiler.timeout.response,
  deadline: config.apis.riskProfiler.timeout.deadline,
}
const agentOptions = {
  maxSockets: config.apis.oauth2.agent.maxSockets,
  maxFreeSockets: config.apis.oauth2.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.oauth2.agent.freeSocketTimeout,
}
const keepaliveAgent = oauthUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

function generateOauthClientToken(
  clientId = config.apis.oauth2.apiClientId,
  clientSecret = config.apis.oauth2.apiClientSecret,
) {
  return generate(clientId, clientSecret)
}

function generate(clientId, clientSecret) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}

async function getApiClientToken(username) {
  const redisKey = username || '%ANONYMOUS%'
  const tokenFromRedis = await getRedisAsync(redisKey)
  if (tokenFromRedis) {
    return { body: { access_token: tokenFromRedis } }
  }

  const oauthRiskProfilerClientToken = generateOauthClientToken()

  const oauthRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  logger.info(
    `Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.apiClientId}' and user '${username}'`,
  )

  const newToken = await superagent
    .post(oauthUrl)
    .set('Authorization', oauthRiskProfilerClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .agent(keepaliveAgent)
    .send(oauthRequest)
    .timeout(timeoutSpec)

  // set TTL slightly less than expiry of token
  await setRedisAsync(redisKey, newToken.body.access_token, 'EX', newToken.body.expires_in - 60)

  return newToken
}
