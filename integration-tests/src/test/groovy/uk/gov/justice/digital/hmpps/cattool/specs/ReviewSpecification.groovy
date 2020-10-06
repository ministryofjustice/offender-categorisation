package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ReviewPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

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
        extremismRating : [previousTerrorismOffences: "Yes", previousTerrorismOffencesText: 'Previous Terrorism Offences Text'],
        nextReviewDate  : [date: "14/12/2019"]
      ],
      security: [
        review: [
          securityReview: 'Here is the Security information held on this prisoner'
        ]
      ]
    ]))

    when: 'The task list is displayed for a fully completed set of ratings'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false,  false, 'C', false)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    selectFirstPrisoner() // has been sorted to top of list!
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)
    riskProfilerApi.stubGetLifeProfile('B2345YZ', 'C')

    then: 'the completed text is displayed'
    summarySection[0].text() == 'Review and categorisation'
    summarySection[1].text() == 'All tasks completed'

    when: 'The continue link is selected'
    continueButton.click()

    then: 'the review page is displayed with the saved form details and securityBack link enabled'
    at ReviewPage
    headerValue*.text() == fixture.FULL_HEADER
    changeLinks.size() == 10
    offendingHistorySummary*.text() == ['Cat A (2012)', 'Libel (21/02/2019)\nSlander (22/02/2019 - 24/02/2019)\nUndated offence', 'Yes\nsome convictions']
    furtherChargesSummary*.text() == ['Yes\ncharges text', 'No']
    violenceRatingSummary*.text() == ['5', '2', 'No', 'Yes\nHere are the serious threat details']
    escapeRatingSummary*.text() == ['Yes', 'Yes', 'Yes\nEscape Other Evidence Text', 'Yes\nReason why Cat B']
    extremismRatingSummary*.text() == ['Yes', 'Yes\nPrevious Terrorism Offences Text']
    securityInputSummary*.text() == ['No', 'Yes', 'No', 'Here is the Security information held on this prisoner', 'Yes']
    nextReviewDateSummary*.text() == ['Saturday 14th December 2019']

    changeLinks.filter(href: contains('/form/ratings/securityBack/')).displayed
    !changeLinks.filter(href: contains('/form/ratings/securityInput/')).displayed

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.risk_profile[0].toString())

    response.history == [catAType: 'A', finalCat: 'Cat B', catAEndYear: '2013', releaseYear: '2014', catAStartYear: '2012']
    response.offences == [[bookingId: 12, offenceDate: '2019-02-21', offenceDescription: 'Libel'],
                          [bookingId: 12, offenceDate: '2019-02-22', offenceRangeDate: '2019-02-24', offenceDescription: 'Slander'],
                          [bookingId: 12, offenceDescription: 'Undated offence']]
    response.socProfile == [nomsId: 'B2345YZ', riskType: 'SOC', transferToSecurity: false, provisionalCategorisation: 'C']
    response.escapeProfile == [nomsId                   : 'B2345YZ', riskType: 'ESCAPE', activeEscapeList: true, activeEscapeRisk: true,
                               escapeListAlerts         : [[active: true, comment: 'First xel comment', expired: false, alertCode: 'XEL', dateCreated: '2016-09-14', alertCodeDescription: 'Escape List'],
                                                           [active: false, comment: '''
Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text
 comment with lengthy text comment with lengthy text comment with lengthy text
  comment with lengthy text comment with lengthy text comment with lengthy text
   comment with lengthy text comment with lengthy text comment with lengthy text
''', expired: true, alertCode: 'XEL', dateCreated: '2016-09-15', alertCodeDescription: 'Escape List']],
                               escapeRiskAlerts         : [[active: true, comment: 'First xer comment', expired: false, alertCode: 'XER', dateCreated: '2016-09-16', alertCodeDescription: 'Escape Risk']],
                               provisionalCategorisation: 'C']
    response.violenceProfile == [nomsId                 : 'B2345YZ', riskType: 'VIOLENCE', displayAssaults: false, numberOfAssaults: 5, notifySafetyCustodyLead: true,
                                 numberOfSeriousAssaults: 2, numberOfNonSeriousAssaults: 3, provisionalCategorisation: 'C', veryHighRiskViolentOffender: true]
    response.extremismProfile == [nomsId: 'B2345YZ', riskType: 'EXTREMISM', notifyRegionalCTLead: false, increasedRiskOfExtremism: true, provisionalCategorisation: 'C']
    response.lifeProfile == [nomsId: 'B2345YZ', riskType: 'LIFE', provisionalCategorisation: 'C']
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
        extremismRating : [previousTerrorismOffences: "Yes", previousTerrorismOffencesText: 'Previous Terrorism Offences Text'],
        nextReviewDate  : [date: "14/12/2019"]
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
    riskProfilerApi.stubGetLifeProfile('B2345YZ', 'C')
    at new TasklistPage(bookingId: '12')
    continueButton.click()

    then: 'the review page is displayed with manual security link enabled'
    at ReviewPage
    changeLinks.size() == 9
    changeLinks.filter(href: contains('/form/ratings/securityInput/')).displayed
    !changeLinks.filter(href: contains('/form/ratings/securityBack/')).displayed
  }
}
