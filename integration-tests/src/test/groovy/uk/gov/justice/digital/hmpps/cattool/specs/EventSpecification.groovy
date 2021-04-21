package uk.gov.justice.digital.hmpps.cattool.specs

import com.amazonaws.auth.AWSStaticCredentialsProvider
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.services.sqs.AmazonSQS
import com.amazonaws.services.sqs.AmazonSQSClientBuilder
import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import java.time.LocalDate

class EventSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration().extensions(new ResponseTemplateTransformer(false)))

  DatabaseUtils db = new DatabaseUtils()

  AmazonSQS sqs = AmazonSQSClientBuilder
    .standard()
    .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials('foo', 'bar')))
    .withRegion('eu-west-2')
    .build()

  def setup() {
    db.clearDb()
  }

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

    when: 'a prison transfer event arrives'

    def bookingId = 123
    def toAgency = 'LEI'
    sqs.sendMessage('http://localhost:4576/queue/event', """{
      "Message" : "{ \\"eventType\\": \\"EXTERNAL_MOVEMENT_RECORD-INSERTED\\", \\"offenderIdDisplay\\": \\"A1234AA\\",\\"bookingId\\": ${bookingId}, \\"fromAgencyLocationId\\": \\"MDI\\", \\"toAgencyLocationId\\": \\"${toAgency}\\", \\"movementType\\": \\"ADM\\", \\"movementSeq\\": 1, \\"movementDateTime\\": \\"2020-02-25T15:57:45\\", \\"directionCode\\": \\"IN\\",\\"eventDatetime\\": \\"2020-02-25T16:00:00.0\\", \\"nomisEventType\\": \\"M1_RESULT\\" }",
      "Timestamp" : "2020-01-14T15:14:33.624Z",
      "MessageAttributes" : {
        "code" : { "Type" : "String", "Value" : "" } ,
        "eventType" : { "Type" : "String", "Value" : "EXTERNAL_MOVEMENT_RECORD-INSERTED" } ,
        "id" : { "Type" : "String", "Value" : "f9f1e5e4-999a-78ad-d1d8-442d8864481a" } ,
        "contentType" : { "Type" : "String", "Value" : "text/plain;charset=UTF-8" } ,
        "timestamp" : { "Type" : "Number.java.lang.Long", "Value" : "1579014873619" }
      }
    }""")

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

    def bookingId = 123

    db.doCreateCompleteRow(1, bookingId, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(2, bookingId, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      2, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(3, 124, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(4, 125, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'Z9999ZZ', 'current_timestamp(2)', null, null)

    db.createLiteCategorisation(bookingId, 1, 'A1234AA', 'V', 'MDI')
    db.createUnapprovedLiteCategorisation(bookingId, 2, 'A1234AA', 'V', 'MDI', 'CATEGORISER_USER')
    db.createLiteCategorisation(124, 1, 'A1234AA', 'V', 'MDI')

    db.createRiskChange(1, 'A1234AA', null, 'PROCESSED', '{}', '{}', 'MDI', LocalDate.now())
    db.createRiskChange(2, 'A1234AA', null, 'NEW', '{}', '{}', 'MDI', LocalDate.now())

    db.createSecurityData('A1234AB', 'MDI', 1, 'COMPLETED')
    db.createSecurityData('A1234AA', 'MDI', 2, 'NEW')

    elite2Api.stubGetBasicOffenderDetails(bookingId, 'A1234AB')
    elite2Api.stubGetIdentifiersByBookingId(bookingId)

    when: 'a merge event arrives merging A1234AA to A1234AB'

    sqs.sendMessage('http://localhost:4576/queue/event', """{
      "Message" : "{ \\"eventType\\": \\"BOOKING_NUMBER-CHANGED\\", \\"bookingId\\": ${bookingId}, \\"offenderId\\":1577871, \\"previousBookingNumber\\": \\"M07037\\",\\"eventDatetime\\": \\"2020-02-25T16:00:00.0\\", \\"nomisEventType\\": \\"BOOK_UPD_OASYS\\" }",
      "MessageAttributes" : {
        "eventType" : { "Type" : "String", "Value" : "BOOKING_NUMBER-CHANGED" } ,
        "id" : { "Type" : "String", "Value" : "f9f1e5e4-999a-78ad-d1d8-442d8864481a" } ,
        "contentType" : { "Type" : "String", "Value" : "text/plain;charset=UTF-8" } ,
        "timestamp" : { "Type" : "Number.java.lang.Long", "Value" : "1579014873619" }
      }
    }""")

    /*
    """
{ "Message" : "{\\"eventType\\":\\"BOOKING_NUMBER-CHANGED\\",\\"eventDatetime\\":\\"2021-04-19T15:53:26.870351\\",\\"offenderId\\":1577871,\\"bookingId\\":2682588,\\"previousBookingNumber\\":\\"M07037\\",\\"nomisEventType\\":\\"BOOK_UPD_OASYS\\"}",
 "Timestamp" : "2021-04-19T15:00:45.767Z", "SignatureVersion" : "1",
 "Signature" : "SN7KVbzfOREy89YzcyIjs3GRUINuw06ZHohg/IeK8wAqI5IdnN//c8k7NmDT0JDKQxM2a6NReeTt+JuUlC7dflW3Q5wRbZlan9JXs8+o8ahRfZPqBaexoMcXl1UF6qs/GWbPDSdyIQhNGfCSctr7CGWUM2H0znoupJndDtk/MBpnu7BR8sk4pJu4C1+fvi8o1WCe9H7hpJq5YqOFu1y1KhzBbfrXHG+gB3ACX1WSrEdsqasXc6Hp7Qj3taZQyHjPuWm10UHCl5MKldkHKRx5CBUMWicNlXrXSgUdkLyi1+VfyWIm6zLs6TkN1Zxm6trTh327GFS+PbKigLyGm9Hf2w==",
 "SigningCertURL" : "https://sns.eu-west-2.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem",
 "UnsubscribeURL" : "https://sns.eu-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-2:754256621582:cloud-platform-Digital-Prison-Services-160f3055cc4e04c4105ee85f2ed1fccb:f07f7afc-eee4-4859-81d6-b836efab36ca",
   "MessageAttributes" : { "eventType" : {"Type":"String","Value":"BOOKING_NUMBER-CHANGED"}, "id" : {"Type":"String","Value":"f23d0817-095d-a191-19ce-5ec6c3a7c220"},
      "contentType" : {"Type":"String","Value":"text/plain;charset=UTF-8"}, "timestamp" : {"Type":"Number.java.lang.Long","Value":"1618844445759"} } }
"""*/

    then: 'The offenderNo is updated as follows'

    waitFor {
      db.getData(123).offender_no == ['A1234AB', 'A1234AB']
      db.getData(124).offender_no == ['A1234AB']
      db.getData(125).offender_no == ['Z9999ZZ']

      db.getLiteData(123).offender_no == ['A1234AB', 'A1234AB']
      db.getLiteData(124).offender_no == ['A1234AB']

      db.getRiskChange('A1234AA').id == []
      db.getRiskChange('A1234AB').id == [1,2]

      db.getSecurityData('A1234AA').id == [2]
      db.getSecurityData('A1234AB').id == []
    }
  }
}
