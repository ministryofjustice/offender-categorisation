const { Consumer } = require('sqs-consumer')
const AWS = require('aws-sdk')
const logger = require('../../log')
const { config } = require('../config')
const db = require('../data/dataAccess/db')
const { events } = require('../utils/eventUtils')

AWS.config.update({
  region: 'eu-west-2',
})

module.exports = function createSqsService(offenderService, formService) {
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
    eventQueueConsumer,
  }
}
