const { Consumer } = require('sqs-consumer')
const AWS = require('aws-sdk')
const logger = require('../../log').default
const { config } = require('../config')
const riskChangeHelper = require('../utils/riskChange')
const db = require('../data/dataAccess/db')
const { events } = require('../utils/eventUtils')

AWS.config.update({
  region: 'eu-west-2',
})

module.exports = function createSqsService(offenderService, formService) {
  const handleRiskProfilerMessage = async message => {
    logger.debug({ Body: message.Body }, 'Received risk profiler message')
    const change = JSON.parse(message.Body)

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
              transactionalDbClient,
            )
          })
        } else {
          logger.debug(
            `Ignoring Risk Change alert for category ${detail.categoryCode} as category cannot be increased or this is not a recategorisation for offender ${change.offenderNo}`,
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

  const rpSqsAccessKeyId = config.sqs.riskProfiler.accessKeyId
  const rpSqsSecretAccessKey = config.sqs.riskProfiler.secretAccessKey

  const rpSqsCredentials =
    rpSqsAccessKeyId && rpSqsSecretAccessKey
      ? {
          accessKeyId: rpSqsAccessKeyId,
          secretAccessKey: rpSqsSecretAccessKey,
        }
      : undefined

  const rpQueueConsumer = Consumer.create({
    queueUrl: config.sqs.riskProfiler.queueUrl,
    handleMessage: handleRiskProfilerMessage,

    sqs: new AWS.SQS({
      ...rpSqsCredentials,
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
          case events.EVENT_DOMAIN_PRISONER_OFFENDER_SEARCH_PRISONER_RELEASED: {
            logger.info(
              { event },
              `${events.EVENT_DOMAIN_PRISONER_OFFENDER_SEARCH_PRISONER_RELEASED}: Received payload`,
            )
            const nomsNumber = event?.additionalInformation?.nomsNumber
            if (!nomsNumber) {
              logger.warn({ MessageId: message.MessageId }, 'MessageId was missing a nomsNumber')
              break
            }
            const reason = event?.additionalInformation?.reason
            if (!reason || reason !== 'RELEASED') {
              logger.info({ MessageId: message.MessageId, nomsNumber }, 'Reason was not "RELEASED"')
              break
            }
            await formService.deletePendingCategorisations(nomsNumber, transactionalDbClient)
            break
          }
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
                transactionalDbClient,
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

  const eventSqsAccessKeyId = config.sqs.event.accessKeyId
  const eventSqsSecretAccessKey = config.sqs.event.secretAccessKey

  const eventSqsCredentials =
    eventSqsAccessKeyId && eventSqsSecretAccessKey
      ? {
          accessKeyId: eventSqsAccessKeyId,
          secretAccessKey: eventSqsSecretAccessKey,
        }
      : undefined

  const eventQueueConsumer = Consumer.create({
    queueUrl: config.sqs.event.queueUrl,
    handleMessage: handleEventMessage,
    sqs: new AWS.SQS({
      ...eventSqsCredentials,
    }),
  })

  logger.info(`Consuming from queues ${config.sqs.riskProfiler.queueUrl}, ${config.sqs.event.queueUrl}`)

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
