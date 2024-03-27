package uk.gov.justice.digital.hmpps.cattool.specs

import com.amazonaws.auth.AWSStaticCredentialsProvider
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.client.builder.AwsClientBuilder
import com.amazonaws.services.sqs.AmazonSQS
import com.amazonaws.services.sqs.AmazonSQSClientBuilder
import com.amazonaws.services.sqs.model.SendMessageRequest
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount

import java.time.LocalDate

/**
 *                                              **  TEST NOTES  **
 *
 * These tests are to be run as a group - later tests depend on earlier test setup steps and will not pass independently.
 *
 * Be sure that all four queues exist in Localstack before running. These should match up to those found in
 * the `config.js` file. E.g.:
 *
 *  - RP_QUEUE_URL=http://0.0.0.0:4576/queue/risk_profiler_change
 *  - RP_DL_QUEUE_URL=http://0.0.0.0:4576/queue/risk_profiler_change_dlq
 *  - EVENT_QUEUE_URL=http://0.0.0.0:4576/queue/event
 *  - EVENT_DL_QUEUE_URL=http://0.0.0.0:4576/queue/event_dlq
 *
 *  Ensure SQS_ENABLED=true in your `.env` file.
 *
 *  Also ensure you have set the following in your `.env` file:
 *
 *  - RP_QUEUE_ACCESS_KEY_ID=dummy
 *  - RP_QUEUE_SECRET_ACCESS_KEY=dummy
 *  - RP_DL_QUEUE_ACCESS_KEY_ID=dummy
 *  - RP_DL_QUEUE_SECRET_ACCESS_KEY=dummy
 */
class EventSpecification extends AbstractSpecification {

  AmazonSQS sqs = AmazonSQSClientBuilder
    .standard()
    .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials('foo', 'bar')))
    .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration('http://localhost:4566', 'eu-west-2'))
    .build()

  def "prison transfer events should change the prison id in all tables"() {

    db.doCreateCompleteRow(1, 123, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(2, 123, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      2, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(3, 124, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(4, 125, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AB', 'current_timestamp(2)', null, null)

    db.createRiskChange(1, 'A1234AA', null, 'PROCESSED', '{}', '{}', 'MDI', LocalDate.now())
    db.createRiskChange(2, 'A1234AA', null, 'NEW', '{}', '{}', 'MDI', LocalDate.now())

    db.createSecurityData('A1234AA', 'MDI', 1, 'NEW')
    db.createSecurityData('A1234AB', 'MDI', 2, 'NEW')

    db.createLiteCategorisation(123, 1, 'A1234AA', 'V', 'MDI')
    db.createUnapprovedLiteCategorisation(123, 2, 'A1234AA', 'V', 'MDI', 'CATEGORISER_USER')
    db.createLiteCategorisation(124, 1, 'A1234AA', 'V', 'MDI')

    elite2Api.stubGetBasicOffenderDetails(123, 'A1234AB')
    fixture.stubLogin(UserAccount.CATEGORISER_USER)

    when: 'a prison transfer event arrives'

    def sendMessageRequest = new SendMessageRequest()
      .withQueueUrl('http://localhost:4566/000000000000/event')
      .withMessageBody("""{
        "Message" : "{ \\"eventType\\": \\"EXTERNAL_MOVEMENT_RECORD-INSERTED\\", \\"offenderIdDisplay\\": \\"A1234AA\\",\\"bookingId\\":123, \\"fromAgencyLocationId\\": \\"MDI\\", \\"toAgencyLocationId\\": \\"LEI\\", \\"movementType\\": \\"ADM\\", \\"movementSeq\\": 1, \\"movementDateTime\\": \\"2020-02-25T15:57:45\\", \\"directionCode\\": \\"IN\\",\\"eventDatetime\\": \\"2020-02-25T16:00:00.0\\", \\"nomisEventType\\": \\"M1_RESULT\\" }",
        "Timestamp" : "2020-01-14T15:14:33.624Z",
        "MessageAttributes" : {
          "code" : { "Type" : "String", "Value" : "" } ,
          "eventType" : { "Type" : "String", "Value" : "EXTERNAL_MOVEMENT_RECORD-INSERTED" } ,
          "id" : { "Type" : "String", "Value" : "f9f1e5e4-999a-78ad-d1d8-442d8864481a" } ,
          "contentType" : { "Type" : "String", "Value" : "text/plain;charset=UTF-8" } ,
          "timestamp" : { "Type" : "Number.java.lang.Long", "Value" : "1579014873619" }
        }
      }""")

    sqs.sendMessage(sendMessageRequest)

    then: 'The prison id is updated as follows'

    waitFor {
      def data = db.getData(123)
      data.id == [1, 2]
      data.prison_id == ['MDI', 'LEI']

      db.getData(124).prison_id == ['MDI']

      def lite = db.getLiteData(123)
      lite.sequence == [1, 2]
      lite.prison_id == ['MDI', 'LEI']
      db.getLiteData(124).prison_id == ['MDI']

      def rc = db.getRiskChange('A1234AA')
      rc.id == [1, 2]
      rc.prison_id == ['MDI', 'LEI']

      db.getSecurityData('A1234AA').prison_id == ['LEI']
      db.getSecurityData('A1234AB').prison_id == ['MDI']
    }
  }

  def "merge events should change the offenderNo in all tables"() {

    db.doCreateCompleteRow(1, 123, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(2, 123, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      2, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(3, 124, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(4, 125, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'Z9999ZZ', 'current_timestamp(2)', null, null)

    db.createLiteCategorisation(123, 1, 'A1234AA', 'V', 'MDI')
    db.createUnapprovedLiteCategorisation(123, 2, 'A1234AA', 'V', 'MDI', 'CATEGORISER_USER')
    db.createLiteCategorisation(124, 1, 'A1234AA', 'V', 'MDI')

    db.createRiskChange(1, 'A1234AA', null, 'PROCESSED', '{}', '{}', 'MDI', LocalDate.now())
    db.createRiskChange(2, 'A1234AA', null, 'NEW', '{}', '{}', 'MDI', LocalDate.now())

    db.createSecurityData('A1234AB', 'MDI', 1, 'COMPLETED')
    db.createSecurityData('A1234AA', 'MDI', 2, 'NEW')

    elite2Api.stubGetBasicOffenderDetails(123, 'A1234AB')
    elite2Api.stubGetIdentifiersByBookingId(123)
    elite2Api.stubSetInactive(123, 'ACTIVE')

    when: 'a merge event arrives merging A1234AA to A1234AB'

    fixture.stubLogin(UserAccount.CATEGORISER_USER)

    def sendMessageRequest = new SendMessageRequest()
      .withQueueUrl('http://localhost:4566/000000000000/event')
      .withMessageBody("""{
      "Message" : "{ \\"eventType\\": \\"BOOKING_NUMBER-CHANGED\\", \\"bookingId\\":123, \\"offenderId\\":1577871, \\"previousBookingNumber\\": \\"M07037\\",\\"eventDatetime\\": \\"2020-02-25T16:00:00.0\\", \\"nomisEventType\\": \\"BOOK_UPD_OASYS\\" }",
      "MessageAttributes" : {
        "eventType" : { "Type" : "String", "Value" : "BOOKING_NUMBER-CHANGED" } ,
        "id" : { "Type" : "String", "Value" : "f9f1e5e4-999a-78ad-d1d8-442d8864481a" } ,
        "contentType" : { "Type" : "String", "Value" : "text/plain;charset=UTF-8" } ,
        "timestamp" : { "Type" : "Number.java.lang.Long", "Value" : "1579014873619" }
      }
    }""")

    sqs.sendMessage(sendMessageRequest)

    then: 'The offenderNo is updated as follows'

    waitFor {
      db.getData(123).offender_no == ['A1234AB', 'A1234AB']
      db.getData(124).offender_no == ['A1234AB']
      db.getData(125).offender_no == ['Z9999ZZ']

      db.getLiteData(123).offender_no == ['A1234AB', 'A1234AB']
      db.getLiteData(124).offender_no == ['A1234AB']

      db.getRiskChange('A1234AA').id == []
      db.getRiskChange('A1234AB').id == [1,2]

      db.getSecurityData('A1234AA').id == []
      db.getSecurityData('A1234AB').id == [2]
    }
  }

  def "Clear DLQ job moves messages to the normal queue"() {
    // this test relies on setup steps from the previous tests and will not pass in isolation.

    given: 'There are messages stuck on the DLQs'

    def sendMessageRequestEventDLQ = new SendMessageRequest()
      .withQueueUrl('http://localhost:4566/000000000000/event_dlq')
      .withMessageBody("""{
      "Message" : "{ \\"eventType\\": \\"BOOKING_NUMBER-CHANGED\\", \\"bookingId\\":1234, \\"offenderId\\":1577871, \\"previousBookingNumber\\": \\"M07037\\",\\"eventDatetime\\": \\"2020-02-25T16:00:00.0\\", \\"nomisEventType\\": \\"BOOK_UPD_OASYS\\" }",
      "MessageAttributes" : {
        "eventType" : { "Type" : "String", "Value" : "BOOKING_NUMBER-CHANGED" } ,
        "id" : { "Type" : "String", "Value" : "f9f1e5e4-999a-78ad-d1d8-442d8864481a" } ,
        "contentType" : { "Type" : "String", "Value" : "text/plain;charset=UTF-8" } ,
        "timestamp" : { "Type" : "Number.java.lang.Long", "Value" : "1579014873619" }
      }
    }""")

    sqs.sendMessage(sendMessageRequestEventDLQ)

    def sendMessageRequestRiskProfilerChangeDLQ = new SendMessageRequest()
      .withQueueUrl('http://localhost:4566/000000000000/risk_profiler_change_dlq')
      .withMessageBody("""{
      "offenderNo": "G1234FF",
      "oldProfile": {"soc": {"transferToSecurity": false} , "escape": {"escapeListAlerts": [], "escapeRiskAlerts": [] }, "violence" : {} },
      "newProfile": {"soc": {"transferToSecurity": true } , "escape": {"escapeListAlerts": [], "escapeRiskAlerts": [] }, "violence" : {} }
    }""")

    sqs.sendMessage(sendMessageRequestRiskProfilerChangeDLQ)

    elite2Api.stubGetBasicOffenderDetails(1234, 'A1234AB')
    elite2Api.stubGetIdentifiersByBookingId(1234)
    elite2Api.stubGetFullOffenderDetails(1235, 'G1234FF')

    when: 'the job runs'

    def file = new File("../jobs/dead-letter/clearDeadLetterQueuesWithExit.js")
    def command = "node " + file.absolutePath
    def env = System.getenv()
    def envlist = []
    env.each() { k,v -> envlist.push( "$k=$v" ) }
    def proc = command.execute(envlist, new File('..'))
    proc.getInputStream().transferTo(System.out)
    proc.getErrorStream().transferTo(System.err)
    proc.waitFor()

    then: 'the messages are received'
    proc.exitValue() == 0
    elite2Api.verifyGetBasicOffenderDetails(1234) == null // used during event Q processing
    elite2Api.verifyGetFullOffenderDetails('G1234FF') == null // used during risk_profiler_change Q processing
  }
}
