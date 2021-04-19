package uk.gov.justice.digital.hmpps.cattool.specs

import com.amazonaws.auth.AWSStaticCredentialsProvider
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.services.sqs.AmazonSQS
import com.amazonaws.services.sqs.AmazonSQSClientBuilder
import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class EventSpecification extends GebReportingSpec {

//  class JasonBuilder {
//    String suggested
//    String overridden
//    String supervisor
//
//    JasonBuilder securityType(securityType) {
//      return this
//    }
//
//    String build() {
//      def contents = [categoriser: [provisionalCategory: [suggestedCategory: suggested, overriddenCategory: overridden]],
//                      supervisor : [review: supervisor ? [supervisorOverriddenCategory: supervisor] : null]
//      ]
//      return JsonOutput.toJson(contents)
//    }
//  }

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration().extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  AmazonSQS sqs = AmazonSQSClientBuilder
    .standard()
    .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials('foo', 'bar')))
    .withRegion('eu-west-2')
    .build()

  def setup() {
    db.clearDb()
  }

  def "prison transfer events should change the agency"() {

    db.doCreateCompleteRow(1, 123, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(2, 123, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null,
      2, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(3, 124, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AA', 'current_timestamp(2)', null, null)
    db.doCreateCompleteRow(4, 125, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      1, null, 'MDI', 'A1234AB', 'current_timestamp(2)', null, null)

//    db.createRiskChange(1, 'A1234AA', null, 'NEW', '{}', '{}', 'MDI', LocalDate.now())
//    db.createRiskChange(2, 'A1234AA', null, 'NEW', '{}', '{}', 'MDI', LocalDate.now())
//    db.createSecurityData('A1234AA', 'MDI', 1)
//    db.createSecurityData('A1234AA', 'MDI', 2)
    db.createLiteCategorisation(131, 1, 'A1234AA', 'V', 'MDI')
    db.createUnapprovedLiteCategorisation(131, 2, 'A1234AA', 'V', 'MDI', 'CATEGORISER_USER')
    db.createLiteCategorisation(132, 1, 'A1234AB', 'V', 'MDI')

//    given: 'a categoriser is logged in with unapproved categorisations'
//    elite2Api.stubUncategorised()
//    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
//    fixture.loginAs(CATEGORISER_USER)

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
      data.id ==[1,2]
      data.prison_id == ['MDI', 'LEI']
      db.getData(124).prison_id == ['MDI']
      def lite = db.getLiteData(131)
      lite.seq==[1,2]
      lite.prison_id == ['MDI', 'LEI']
      db.getLiteData(132).prison_id == ['MDI']

    }


  }

}
