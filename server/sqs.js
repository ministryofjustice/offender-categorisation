const { Consumer } = require('sqs-consumer')
const logger = require('../log.js')
const config = require('./config')
const riskChangeHelper = require('./utils/riskChange')
const db = require('./data/dataAccess/db')

module.exports = function createSqsService(offenderService, formService) {
  const app = Consumer.create({
    queueUrl: config.sqs.riskProfilerQueue,
    handleMessage: async message => {
      logger.debug(`Received message with json message body : ${message.Body}`)
      const change = JSON.parse(message.Body)
      logger.info(`received risk change payload for offender ${change.offenderNo}`)

      if (alertIsRequired(change)) {
        try {
          // todo check endpoint will return inactive offender details
          const detail = await offenderService.getOffenderDetailWithFullInfo(change.offenderNo)

          db.doTransactional(async transactionalDbClient => {
            await formService.createRiskChange({
              offenderNo: change.offenderNo,
              agencyId: detail.agencyId,
              newProfile: change.newProfile,
              oldProfile: change.oldProfile,
              client: transactionalDbClient,
            })
          })
        } catch (error) {
          logger.error(
            `Problem processing risk change payload for offender ${change.offenderNo} \nError returned : ${error}`
          )
          throw error
        }
      } else {
        logger.debug(`Risk Change was not a required alert`)
      }
    },
  })

  logger.info(`Consuming from queue ${config.sqs.riskProfilerQueue}`)

  app.on('error', err => {
    logger.error(err.message)
  })

  app.on('processing_error', err => {
    logger.error(err.message)
  })

  function alertIsRequired(detail) {
    const { oldProfile, newProfile } = detail
    return riskChangeHelper.assessRiskProfiles(oldProfile, newProfile).alertRequired
  }

  function start() {
    app.start()
  }

  return {
    start,
  }
}
