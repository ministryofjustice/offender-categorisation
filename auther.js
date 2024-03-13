const querystring = require('querystring')
const logger = require('./log')
const config = require('./server/config')
const superagent = require('superagent')

// --
;(async () => {
  console.log('try auth')

  const username = null
  const clientId = 'christopher-moss'
  const clientSecret = 'Z.0&yJJ:I$8s)vf(IdB4a7>>u5QP;(n)<u>USh-zar!,pLlE2YM.z6ewSW<W'

  const oauthUrl = `https://sign-in-preprod.hmpps.service.justice.gov.uk/auth/oauth/token`

  const timeoutSpec = {
    response: config.apis.oauth2.timeout.response,
    deadline: config.apis.oauth2.timeout.deadline,
  }

  // function generateAuthClientToken(
  //   clientId = config.apis.oauth2.apiClientId,
  //   clientSecret = config.apis.oauth2.apiClientSecret
  // ) {
  //   const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  //   return `Basic ${token}`
  // }

  function generateAdminClientToken() {
  // clientId = config.apis.oauth2.apiClientAdminId,
  // clientSecret = config.apis.oauth2.apiClientAdminSecret
    const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    return `Basic ${token}`
  }

  const socClientToken = generateAdminClientToken()

  const oauthRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  logger.debug(
    `Oauth request '${oauthRequest}' for clientId '${config.apis.oauth2.apiClientAdminId}' and user '${username}'`
  )

  const newToken = await superagent
    .post(oauthUrl)
    .set('Authorization', socClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec)

  console.log('newToken', newToken.body)
})()
