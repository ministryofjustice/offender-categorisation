const AWS = require('aws-sdk')
const logger = require('../../log')
const config = require('../../server/config')
const { transferDlqEventMessages } = require('../../server/utils/eventUtils')

const sqsRiskProfiler = new AWS.SQS({
  region: 'eu-west-2',
  accessKeyId: config.sqs.riskProfiler.accessKeyId,
  secretAccessKey: config.sqs.riskProfiler.secretAccessKey,
})

const sqsRiskProfilerQueueUrl = config.sqs.riskProfiler.queueUrl

const sqsRiskProfilerDlq = new AWS.SQS({
  region: 'eu-west-2',
  accessKeyId: config.sqs.riskProfiler.dlq.accessKeyId,
  secretAccessKey: config.sqs.riskProfiler.dlq.secretAccessKey,
})

const sqsRiskProfilerDlqQueueUrl = config.sqs.riskProfiler.dlq.queueUrl

const sqsEvent = new AWS.SQS({
  region: 'eu-west-2',
  accessKeyId: config.sqs.event.accessKeyId,
  secretAccessKey: config.sqs.event.secretAccessKey,
})

const sqsEventQueueUrl = config.sqs.event.queueUrl

const sqsEventDlq = new AWS.SQS({
  region: 'eu-west-2',
  accessKeyId: config.sqs.event.dlq.accessKeyId,
  secretAccessKey: config.sqs.event.dlq.secretAccessKey,
})

const sqsEventDlqQueueUrl = config.sqs.event.dlq.queueUrl

async function runJob() {
  logger.info('DLQ transfer job starting')
  try {
    await transferDlqEventMessages({
      sqs: sqsRiskProfiler,
      sqsDlq: sqsRiskProfilerDlq,
      sqsDlqQueueUrl: sqsRiskProfilerDlqQueueUrl,
      sqsQueueUrl: sqsRiskProfilerQueueUrl,
    })
  } catch (error) {
    logger.error(error, 'Problem processing RiskProfiler DLQ transfer job')
  }
  try {
    await transferDlqEventMessages({
      sqs: sqsEvent,
      sqsDlq: sqsEventDlq,
      sqsDlqQueueUrl: sqsEventDlqQueueUrl,
      sqsQueueUrl: sqsEventQueueUrl,
    })
  } catch (error) {
    logger.error(error, 'Problem processing Event DLQ transfer job')
  }
  logger.info('DLQ transfer job finished')
}

module.exports = runJob
