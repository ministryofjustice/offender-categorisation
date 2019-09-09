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

          if (categoryCouldMoveUp(detail)) {
            logger.info(`Creating risk change record for offender ${change.offenderNo}`)

            db.doTransactional(async transactionalDbClient => {
              await formService.createRiskChange(
                change.offenderNo,
                detail.agencyId,
                change.oldProfile,
                change.newProfile,
                transactionalDbClient
              )
            })
          } else {
            logger.debug(`Ignoring Risk Change alert for category ${detail.categoryCode} as category cannot be increased`)
          }
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

  function categoryCouldMoveUp(detail) {
    return detail && (detail.categorycode !== 'B' && detail.categorycode !== 'I')
  }

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
