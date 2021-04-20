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
    }
    waitFor {
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
}
