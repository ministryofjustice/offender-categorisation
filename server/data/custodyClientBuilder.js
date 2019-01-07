const logger = require('../../log')
const config = require('../config')
const superagent = require('superagent')
const querystring = require('querystring')
const { generateOauthClientToken } = require('../authentication/clientCredentials')

const timeoutSpec = {
    response: config.apis.custody.timeout.response,
    deadline: config.apis.custody.timeout.deadline
};

const apiUrl = config.apis.custody.url
const oauthUrl = `${config.apis.oauth2.url}/oauth/token`

module.exports = username => {

    const nomisGet = custodyGetBuilder(username)
    const nomisPost = custodyPushBuilder('post', username)
    const nomisPut = custodyPushBuilder('put', username)

    return {

      getOffendersInPrison: function(agencyId) {
        const path = `${apiUrl}api/offenders/prison/${agencyId}`
        logger.debug(`getOffendersInPrison calling custody api : ${path}`)
        return nomisGet({path})
      },
    }
}


function custodyGetBuilder(username) {

    return async ({path, query = '', headers = {}, responseType = ''} = {}) => {

        try {
            const oauthResult = await getCustodyApiClientToken(username)

            const result = await superagent
                .get(path)
                .query(query)
                .set('Authorization', `Bearer ${oauthResult.body.access_token}`)
                .set(headers)
                .responseType(responseType)
                .timeout(timeoutSpec)

            return result.body

        } catch (error) {

            logger.warn('Error calling custody api')
            logger.warn(error)

            throw error
        }
    }
}

function custodyPushBuilder(verb, username) {

    const updateMethod = {
        put: put,
        post: post
    }

    return async ({path, body = '', headers = {}, responseType = ''} = {}) => {

        try {
            const oauthResult = await getCustodyApiClientToken(username)
            const result = await updateMethod[verb](oauthResult.body.access_token, path, body, headers, responseType)
            return result.body

        } catch (error) {

            logger.warn('Error calling custody api')
            logger.warn(error)

            throw error
        }
    }
}

async function post(token, path, body, headers, responseType) {
    return superagent
        .post(path)
        .send(body)
        .set('Authorization', `Bearer ${token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)
}

async function put(token, path, body, headers, responseType) {
    return superagent
        .put(path)
        .send(body)
        .set('Authorization', `Bearer ${token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)
}

async function getCustodyApiClientToken(username) {

  const oauthCustodyClientToken = generateOauthClientToken()
  const oauthRequest = querystring.stringify({grant_type: 'client_credentials', username});

  logger.info(`Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.apiClientId}'`);

  return superagent
    .post(oauthUrl)
    .set('Authorization', oauthCustodyClientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec);
}



