import AWS from 'aws-sdk'
import logger from '../../log'
import { config } from '../../server/config'
import { transferDlqEventMessages } from '../../server/utils/eventUtils'

const sqsRiskProfilerCredentials = getAwsCredentials(
  config.sqs.riskProfiler.accessKeyId,
  config.sqs.riskProfiler.secretAccessKey,
)

const sqsRiskProfiler = new AWS.SQS({
  region: 'eu-west-2',
  ...sqsRiskProfilerCredentials,
})

const sqsRiskProfilerQueueUrl = config.sqs.riskProfiler.queueUrl

const sqsRiskProfilerDlqCredentials = getAwsCredentials(
  config.sqs.riskProfiler.dlq.accessKeyId,
  config.sqs.riskProfiler.dlq.secretAccessKey,
)

const sqsRiskProfilerDlq = new AWS.SQS({
  region: 'eu-west-2',
  ...sqsRiskProfilerDlqCredentials,
})

const sqsRiskProfilerDlqQueueUrl = config.sqs.riskProfiler.dlq.queueUrl

const sqsEventCredentials = getAwsCredentials(config.sqs.event.accessKeyId, config.sqs.event.secretAccessKey)

const sqsEvent = new AWS.SQS({
  region: 'eu-west-2',
  ...sqsEventCredentials,
})

const sqsEventQueueUrl = config.sqs.event.queueUrl

const sqsEventDlqCredentials = getAwsCredentials(config.sqs.event.dlq.accessKeyId, config.sqs.event.dlq.secretAccessKey)

const sqsEventDlq = new AWS.SQS({
  region: 'eu-west-2',
  ...sqsEventDlqCredentials,
})

const sqsEventDlqQueueUrl = config.sqs.event.dlq.queueUrl

export async function clearDLQs() {
  logger.info('DLQ transfer job starting')
  try {
    await transferDlqEventMessages({
      sqs: sqsRiskProfiler,
      sqsDlq: sqsRiskProfilerDlq,
      sqsDlqQueueUrl: sqsRiskProfilerDlqQueueUrl,
      sqsQueueUrl: sqsRiskProfilerQueueUrl,
    })
  } catch (error) {
    logger.error(error, 'Problem processing RiskProfiler DLQ transfer job') // NOTE alert depends on this
    // See Azure monitoring alerts -> DLQ jobs DCS UI
  }
  try {
    await transferDlqEventMessages({
      sqs: sqsEvent,
      sqsDlq: sqsEventDlq,
      sqsDlqQueueUrl: sqsEventDlqQueueUrl,
      sqsQueueUrl: sqsEventQueueUrl,
    })
  } catch (error) {
    logger.error(error, 'Problem processing Event DLQ transfer job') // NOTE alert depends on this
  }
  logger.info('DLQ transfer job finished') // NOTE alert depends on this
}

function getAwsCredentials(accessKeyId?: string, secretAccessKey?: string) {
  return accessKeyId && secretAccessKey
    ? {
        accessKeyId,
        secretAccessKey,
      }
    : undefined
}
