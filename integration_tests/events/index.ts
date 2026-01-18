import AWS from 'aws-sdk'
import { config } from '../../server/config'
import { AGENCY_LOCATION } from '../factory/agencyLocation'

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

const createPrisonerTransferMessage = (
  nomsNumber: string,
  bookingId: number,
  eventType = 'EXTERNAL_MOVEMENT_RECORD-INSERTED',
) => {
  return {
    Message: `{"eventType":"${eventType}","offenderIdDisplay":"${nomsNumber}","bookingId":${bookingId},"fromAgencyLocationId":"${AGENCY_LOCATION.LEI.id}","toAgencyLocationId":"${AGENCY_LOCATION.BMI.id}","movementType":"ADM","movementSeq": 1,"movementDateTime":"2020-02-25T15:57:45","directionCode":"IN","eventDatetime":"2020-02-25T16:00:00.0","nomisEventType":"M1_RESULT"}`,
    Timestamp: '2020-01-14T15:14:33.624Z',
    MessageAttributes: {
      code: { Type: 'String', Value: '' },
      eventType: { Type: 'String', Value: `${eventType}` },
      id: { Type: 'String', Value: 'f9f1e5e4-999a-78ad-d1d8-442d8864481a' },
      contentType: { Type: 'String', Value: 'text/plain;charset=UTF-8' },
      timestamp: { Type: 'Long', Value: '1579014873619' },
    },
  }
}

const sendPrisonerReleasedMessage = ({ nomsNumber, reason = 'RELEASED' }) => {
  return sendMessage(eventParamsWith(createPrisonerReleasedMessage(nomsNumber, reason)))
}

const sendPrisonerTransferMessage = ({ nomsNumber, bookingId, eventType = 'EXTERNAL_MOVEMENT_RECORD-INSERTED' }) => {
  return sendMessage(eventParamsWith(createPrisonerTransferMessage(nomsNumber, bookingId, eventType)))
}

export default {
  sendPrisonerReleasedMessage,
  sendPrisonerTransferMessage,
}
