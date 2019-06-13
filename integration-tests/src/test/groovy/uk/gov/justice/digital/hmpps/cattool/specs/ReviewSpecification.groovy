package uk.gov.justice.digital.hmpps.cattool.specs

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
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ReviewPage

class ReviewSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  def setup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()


  def "The review page can be displayed with security input"() {
    given: 'data has been entered for the ratings pages'
    db.createDataWithStatus(12, 'SECURITY_BACK', JsonOutput.toJson([
      ratings : [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges  : [furtherCharges: 'Yes', furtherChargesText: 'charges text', furtherChargesCatB: 'No'],
        securityInput   : [securityInputNeeded: 'Yes', securityInputNeededText: 'Reasons why referring manually to security'],
        securityBack    : [catB: 'Yes'],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes", seriousThreatText: "Here are the serious threat details"],
        escapeRating    : [escapeOtherEvidence: "Yes", escapeOtherEvidenceText: 'Escape Other Evidence Text', escapeCatB: 'Yes', escapeCatBText: 'Reason why Cat B'],
        extremismRating : [previousTerrorismOffences: "Yes", previousTerrorismOffencesText: 'Previous Terrorism Offences Text']
      ],
      security: [
        review: [
          securityReview: 'Here is the Security information held on this prisoner'
        ]
      ]
    ]))

    when: 'The task list is displayed for a fully completed set of ratings'
    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)

    then: 'the completed text is displayed'
    summarySection[0].text() == 'Review and categorisation'
    summarySection[1].text() == 'Completed'

    when: 'The continue link is selected'
    continueButton.click()

    then: 'the review page is displayed with the saved form details and securityBack link enabled'
    at ReviewPage
    headerValue*.text() == ['Hillmob, Ant', 'B2345YZ', '17/02/1970', 'C',
                            'C-04-02', 'Coventry',
                            'Latvian',
                            'A Felony', 'Another Felony',
                            '10/06/2020',
                            '11/06/2020',
                            '02/02/2020',
                            '13/06/2020',
                            '14/06/2020',
                            '15/06/2020',
                            '16/06/2020',
                            '17/06/2020',
                            '6 years, 3 months']

    changeLinks.size() == 9
    offendingHistorySummary*.text() == ['Cat A (2012)', 'Libel (21/02/2019)\nSlander (22/02/2019 - 24/02/2019)\nUndated offence', 'Yes\nsome convictions']
    furtherChargesSummary*.text() == ['Yes\ncharges text', 'No']
    violenceRatingSummary*.text() == ['5', '2', 'No', 'Yes\nHere are the serious threat details']
    escapeRatingSummary*.text() == ['Yes', 'Yes', 'Yes\nEscape Other Evidence Text', 'Yes\nReason why Cat B']
    extremismRatingSummary*.text() == ['Yes', 'Yes\nPrevious Terrorism Offences Text']
    securityInputSummary*.text() == ['No', 'Yes', 'Here is the Security information held on this prisoner', 'Yes']

    changeLinks.filter(href: contains('/form/ratings/securityBack/')).displayed
    !changeLinks.filter(href: contains('/form/ratings/securityInput/')).displayed

    def data = db.getData(12)[0].risk_profile
    def json = data.toString()
    json.contains '"history": {"catAType": "A",'
    json.contains '"socProfile": {"nomsId": "B2345YZ", "riskType": "SOC", "transferToSecurity": false'
    json.contains '"escapeProfile": {"nomsId": "B2345YZ", "riskType": "ESCAPE", "activeEscapeList": true, "activeEscapeRisk": true,'
    json.contains '"violenceProfile": {"nomsId": "B2345YZ", "riskType": "VIOLENCE", "displayAssaults": false, "numberOfAssaults": 5, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 2, "provisionalCategorisation": "C", "veryHighRiskViolentOffender": true}'
    json.contains '"extremismProfile": {"nomsId": "B2345YZ", "riskType": "EXTREMISM", "notifyRegionalCTLead": false, "increasedRiskOfExtremism": true, "provisionalCategorisation": "C"}'
  }

  def "The review page can be displayed without security input"() {
    given: 'data has been entered for the ratings pages'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges  : [furtherCharges: 'No', furtherChargesCatB: 'No'],
        securityInput   : [securityInputNeeded: 'No'],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "No"],
        escapeRating    : [escapeOtherEvidence: "Yes", escapeOtherEvidenceText: 'Escape Other Evidence Text', escapeCatB: 'No'],
        extremismRating : [previousTerrorismOffences: "Yes", previousTerrorismOffencesText: 'Previous Terrorism Offences Text']
      ]
    ]))
    when: 'The review page is displayed for a fully completed set of ratings'
    fixture.gotoTasklist()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)
    at new TasklistPage(bookingId: '12')
    continueButton.click()

    then: 'the review page is displayed with manual security link enabled'
    at ReviewPage
    changeLinks.size() == 8
    changeLinks.filter(href: contains('/form/ratings/securityInput/')).displayed
    !changeLinks.filter(href: contains('/form/ratings/securityBack/')).displayed
  }
}
