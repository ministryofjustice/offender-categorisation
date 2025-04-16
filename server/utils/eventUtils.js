const logger = require('../../log').default

const deleteDlqMessage = async (sqsDlq, deleteParams) => {
  await sqsDlq.deleteMessage(deleteParams).promise()
  logger.info(`removed message ${deleteParams.ReceiptHandle}`)
}

const resendMessage = async (sqs, params) => {
  return sqs.sendMessage(params).promise()
}

const receiveDlqMessage = async (sqsDlq, sqsDlqQueueUrl) => {
  return sqsDlq
    .receiveMessage({
      QueueUrl: sqsDlqQueueUrl,
    })
    .promise()
}

const getDlqQueueAttributes = async (sqsDlq, sqsDlqQueueUrl) => {
  return sqsDlq
    .getQueueAttributes({ QueueUrl: sqsDlqQueueUrl, AttributeNames: ['ApproximateNumberOfMessages'] })
    .promise()
}

const transferDlqEventMessages = async ({ sqs, sqsDlq, sqsQueueUrl, sqsDlqQueueUrl }) => {
  const dlqAttributes = await getDlqQueueAttributes(sqsDlq, sqsDlqQueueUrl)

  if (dlqAttributes) {
    const messageCount = parseInt(dlqAttributes.Attributes.ApproximateNumberOfMessages, 10)

    if (messageCount > 0) {
      logger.info(`Found ${messageCount} messages on dead letter queue ${sqsDlqQueueUrl}`)
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < messageCount; i++) {
        // eslint-disable-next-line no-await-in-loop
        const messageResponse = await receiveDlqMessage(sqsDlq, sqsDlqQueueUrl)
        if (messageResponse.Messages) {
          const sendParams = {
            QueueUrl: sqsQueueUrl,
            MessageBody: messageResponse.Messages[0].Body,
          }
          // eslint-disable-next-line no-await-in-loop
          await resendMessage(sqs, sendParams)

          logger.info(`resent message ${messageResponse.Messages[0].ReceiptHandle}`)
          const deleteParams = {
            QueueUrl: sqsDlqQueueUrl,
            ReceiptHandle: messageResponse.Messages[0].ReceiptHandle,
          }
          // eslint-disable-next-line no-await-in-loop
          await deleteDlqMessage(sqsDlq, deleteParams)
        } else {
          logger.warn(`No messages returned from DLQ ${sqsDlqQueueUrl}, message count: ${messageCount}`)
        }
      }
    }
  }
}

const events = {
  EVENT_DOMAIN_PRISONER_OFFENDER_SEARCH_PRISONER_RELEASED: 'prisoner-offender-search.prisoner.released',
}

module.exports = { transferDlqEventMessages, events }
