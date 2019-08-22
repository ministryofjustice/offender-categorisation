const { Consumer } = require('sqs-consumer')
const logger = require('../log.js')
const config = require('./config')

const app = Consumer.create({
  queueUrl: config.sqs.riskProfilerQueue,
  handleMessage: async message => {
    logger.info(`received ${message} payload`)
    const change = JSON.parse(message.Body)
    logger.info(`Old profile: ${change.oldProfile}`)
    logger.info(`New profile: ${change.newProfile}`)
  },
})

logger.info(`Consuming from queue ${config.sqs.riskProfilerQueue}`)

app.on('error', err => {
  logger.error(err.message)
})

app.on('processing_error', err => {
  logger.error(err.message)
})

app.start()
