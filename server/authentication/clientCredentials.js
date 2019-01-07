const config = require('../config')
const querystring = require('querystring')

module.exports = {
  generateOauthClientToken,
}

function generateOauthClientToken(clientId = config.apis.oauth2.apiClientId, clientSecret = config.apis.oauth2.apiClientSecret) {
  return generate(clientId, clientSecret)
}

function generate(clientId, clientSecret) {
  const token = Buffer.from(`${querystring.escape(clientId)}:${querystring.escape(clientSecret)}`).toString('base64')
  return `Basic ${token}`
}
