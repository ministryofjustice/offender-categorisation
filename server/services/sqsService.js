const { Consumer } = require('sqs-consumer')
const AWS = require('aws-sdk')
const logger = require('../../log.js')
const config = require('../config')
const riskChangeHelper = require('../utils/riskChange')
const db = require('../data/dataAccess/db')

AWS.config.update({
  region: 'eu-west-2',
})

module.exports = function createSqsService(offenderService, formService) {
  const handleRiskProfilerMessage = async message => {
    logger.debug(`Received message with json message body : ${message.Body}`)
    const change = JSON.parse(message.Body)
    logger.info(`received risk change payload for offender ${change.offenderNo}`)

    if (alertIsRequired(change)) {
      try {
        // todo check endpoint will return inactive offender details
        const context = { user: {} }
        const detail = await offenderService.getOffenderDetailWithFullInfo(context, change.offenderNo)

        if (categoryCouldMoveUp(detail)) {
          logger.info(`Creating risk change record for offender ${change.offenderNo}`)

          await db.doTransactional(async transactionalDbClient => {
            await formService.createRiskChange(
              change.offenderNo,
              detail.agencyId,
              change.oldProfile,
              change.newProfile,
              transactionalDbClient
            )
          })
        } else {
          logger.debug(
            `Ignoring Risk Change alert for category ${detail.categoryCode} as category cannot be increased or this is not a recategorisation for offender ${change.offenderNo}`
          )
        }
      } catch (error) {
        logger.error(error, `Problem processing risk change payload for offender ${change.offenderNo}`)
        throw error
      }
    } else {
      logger.debug(`Risk Change was not a required alert for offender ${change.offenderNo}`)
    }
  }

  const rpQueueConsumer = Consumer.create({
    queueUrl: config.sqs.riskProfilerQueue,
    handleMessage: handleRiskProfilerMessage,
    sqs: new AWS.SQS({
      accessKeyId: config.sqs.riskProfilerQueueAccessKeyId,
      secretAccessKey: config.sqs.riskProfilerQueueSecretAccessKey,
    }),
  })

  rpQueueConsumer.on('error', err => {
    logger.error(err.message)
  })

  rpQueueConsumer.on('processing_error', err => {
    logger.error(err.message)
  })

  /* ensures there is scope to act on the risk change and that the categorisation would be a recat */
  function categoryCouldMoveUp(detail) {
    return detail && (detail.categoryCode === 'C' || detail.categoryCode === 'D' || detail.categoryCode === 'J')
  }

  function alertIsRequired(detail) {
    const { oldProfile, newProfile } = detail
    return riskChangeHelper.assessRiskProfiles(oldProfile, newProfile).alertRequired
  }

  // //////////////////////////////////////////////////////////////////////////////////////////////

  const handleEventMessage = async message => {
    logger.debug({ Body: message.Body }, 'Received event message')
    const event = JSON.parse(JSON.parse(message.Body).Message)

    try {
      await db.doTransactional(async transactionalDbClient => {
        const context = { user: {} }

        switch (event.eventType) {
          case 'BOOKING_NUMBER-CHANGED':
            {
              const { bookingId } = event
              logger.info({ event }, 'Merge: Received payload')
              await offenderService.checkAndMergeOffenderNo(context, bookingId, transactionalDbClient)
            }
            break
          case 'DATA_COMPLIANCE_DELETE-OFFENDER':
            // TODO
            break
          case 'EXTERNAL_MOVEMENT_RECORD-INSERTED':
            {
              const { bookingId, offenderIdDisplay, movementType, fromAgencyLocationId, toAgencyLocationId } = event
              logger.info({ event }, 'Movement: Received payload')
              await offenderService.handleExternalMovementEvent(
                context,
                bookingId,
                offenderIdDisplay,
                movementType,
                fromAgencyLocationId,
                toAgencyLocationId,
                transactionalDbClient
              )
            }
            break
          default:
            logger.debug(`Ignored event of type ${event.eventType}`)
            break
        }
      })
    } catch (error) {
      logger.error(error, `Problem processing event payload`)
      throw error
    }
  }

  const eventQueueConsumer = Consumer.create({
    queueUrl: config.sqs.eventQueue,
    handleMessage: handleEventMessage,
    sqs: new AWS.SQS({
      accessKeyId: config.sqs.eventQueueAccessKeyId,
      secretAccessKey: config.sqs.eventQueueSecretAccessKey,
    }),
  })

  logger.info(`Consuming from queues ${config.sqs.riskProfilerQueue}, ${config.sqs.eventQueue}`)

  eventQueueConsumer.on('error', err => {
    logger.error(err.message)
  })

  eventQueueConsumer.on('processing_error', err => {
    logger.error(err.message)
  })

  return {
    rpQueueConsumer,
    eventQueueConsumer,
  }
}
