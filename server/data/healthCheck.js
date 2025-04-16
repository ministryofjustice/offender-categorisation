const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const logger = require('../../log').default
const db = require('./dataAccess/db')
const getSanitisedError = require('../sanitisedError')

function dbCheck() {
  const MAX_WAIT = 30 * 1000 // 30 seconds
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Database Connection test timed out'))
    }, MAX_WAIT)
  })
  return Promise.race([db.query('SELECT 1 AS ok'), timeout])
    .then(() => {
      return true // The connection is working
    })
    .catch(e => {
      throw e
    })
}

const agentOptions = {
  maxSockets: 100,
  maxFreeSockets: 10,
  freeSocketTimeout: 30000,
}

function serviceCheckFactory(name, url) {
  const keepaliveAgent = url.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

  return () =>
    new Promise((resolve, reject) => {
      superagent
        .get(url)
        .agent(keepaliveAgent)
        .retry(2, err => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .timeout({
          response: 1000,
          deadline: 1500,
        })
        .end((error, result) => {
          if (error) {
            const sanitisedError = getSanitisedError(error)
            logger.error(sanitisedError, `Error calling ${name}`)
            reject(error)
          } else if (result.status === 200) {
            resolve('UP')
          } else {
            reject(result.status)
          }
        })
    })
}

module.exports = {
  dbCheck,
  serviceCheckFactory,
}
