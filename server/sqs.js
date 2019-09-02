const { Consumer } = require('sqs-consumer')
const logger = require('../log.js')
const config = require('./config')
// const db = require('./data/dataAccess/db')
// const formClient = require('./data/formClient')

const app = Consumer.create({
  queueUrl: config.sqs.riskProfilerQueue,
  handleMessage: message => {
    logger.debug(`Received message with json message body : ${message.Body}`)
    const change = JSON.parse(message.Body)
    logger.info(`received risk change payload for offender ${change.offenderNo}`)

    // todo lookup agency
    // todo filter by required alerts

    // db call currently disabled
    /* db.doTransactional(async transactionalDbClient => {
      await formClient.createRiskChange({
        offenderNo: change.offenderNo,
        agencyId: 'LEI',
        newProfile: change.newProfile,
        oldProfile: change.oldProfile,
        client: transactionalDbClient,
      })
    }) */
  },
})

logger.info(`Consuming from queue ${config.sqs.riskProfilerQueue}`)

app.on('error', err => {
  logger.error(err.message)
})

app.on('processing_error', err => {
  logger.error(err.message)
})

function start() {
  app.start()
}

module.exports = start
