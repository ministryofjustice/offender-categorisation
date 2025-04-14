import AWS from 'aws-sdk'
import { config } from '../../server/config'

AWS.config.update({
  region: 'eu-west-2',
})

const sqs = new AWS.SQS()

const eventParamsWith = body => {
  return {
    ...(body && { MessageBody: JSON.stringify(body) }),
    QueueUrl: config.sqs.event.queueUrl,
  }
}

const sendMessage = message => {
  sqs.sendMessage(message, (err, data) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.log('Error', err)
    } else {
      // eslint-disable-next-line no-console
      console.log('Successfully added message', data.MessageId)
    }
  })
  return null
}

const createPrisonerReleasedMessage = (nomsNumber: string, reason = 'RELEASED') => {
  return {
    Type: 'Notification',
    MessageId: 'fake-message-id',
    TopicArn: 'arn:aws:sns:fake',
    Message: `{"additionalInformation":{"nomsNumber":"${nomsNumber}","reason":"${reason}","prisonId":"WTI"},"occurredAt":"2024-07-25T07:57:37.883940701+01:00","eventType":"prisoner-offender-search.prisoner.released","version":1,"description":"A prisoner has been released from a prison with reason: released on temporary absence","detailUrl":"https://prisoner-search.prison.service.justice.gov.uk/prisoner/${nomsNumber}"}`,
    Timestamp: '2024-07-25T06:57:39.938Z',
    SignatureVersion: '1',
    Signature: 'fakesig',
    SigningCertURL: 'https://some.pem',
    UnsubscribeURL: 'https://fake.url',
    MessageAttributes: {
      traceparent: { Type: 'String', Value: 'a-guid' },
      eventType: { Type: 'String', Value: 'prisoner-offender-search.prisoner.released' },
    },
  }
}

const sendPrisonerReleasedMessage = ({ nomsNumber, reason = 'RELEASED' }) => {
  return sendMessage(eventParamsWith(createPrisonerReleasedMessage(nomsNumber, reason)))
}

export default {
  sendPrisonerReleasedMessage,
}
