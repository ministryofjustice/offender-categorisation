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
import uk.gov.justice.digital.hmpps.cattool.pages.ErrorPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class TasklistSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def setup() {
    db.clearDb()
  }

  def "The tasklist for a categoriser is present and can display multiple sentences"() {
    when: 'I go to the tasklist page'
    db.createRiskProfileData(12, JsonOutput.toJson([
      "escapeProfile": [nomsId: "Dummy"]
    ]))
    fixture.gotoTasklist(false, true)

    then: 'The tasklist page is displayed with multiple sentences'
    at(new TasklistPage(bookingId: '12'))
    sentenceTableRow1*.text() == ['2', '31/12/2018', '6 years, 3 months', '', 'Std sentence']
    sentenceTableRow2*.text() == ['4', '31/03/2019', '4 years, 2 months', '2', 'Recall 14 days']
    !continueButton
    continueButtonDisabled.displayed

    and: 'SOC data is stored and merged correctly'
    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.risk_profile[0].toString())
    response == [socProfile   : [nomsId: "B2345YZ", riskType: "SOC", transferToSecurity: false, provisionalCategorisation: 'C'],
                 escapeProfile: [nomsId: "Dummy"]]
  }

  def "The continue button behaves correctly"() {
    when: 'I go to the tasklist page with all sections complete'
    db.createData(12, JsonOutput.toJson([
      ratings       : [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges  : [furtherCharges: "No"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      openConditions: [riskLevels: [likelyToAbscond: "Yes"]]]))
    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    then: 'The continue button takes me to the review page'
    continueButton.displayed
    !continueButtonDisabled
  }

  def "The continue button behaves correctly when openconditions is added to list items"() {
    when: 'I go to the tasklist page with all sections complete'
    db.createData(12, JsonOutput.toJson([
      ratings                   : [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges  : [furtherCharges: "No"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ], openConditionsRequested: true]))
    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    then: 'The continue button takes me to the review page'
    continueButtonDisabled
  }

  def "The tasklist page displays an alert when status is transferred to security"() {
    when: 'I go to the tasklist page'

    fixture.gotoTasklist(true)
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')

    then: 'the prisoner start button is locked'
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Automatically referred to Security ($today)")
    summarySection[0].text() == 'Review and categorisation'
    summarySection[1].text() == 'Tasks not yet complete'

    when: 'a security user views their homepage'
    elite2Api.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    logoutLink.click()
    elite2Api.stubGetCategoriserStaffDetailsByUsernameList(CATEGORISER_USER)
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    fixture.loginAs(SECURITY_USER)

    then: 'this prisoner is present with automatic referral'
    at SecurityHomePage
    prisonNos[0] == 'B2345YZ'
    referredBy[0] == 'Automatic'
  }

  def "The tasklist page correctly populates the database"() {
    when: 'I go to the tasklist page'

    fixture.gotoTasklist(false)

    then: 'A database row is created containing correct basic info'
    at(new TasklistPage(bookingId: '12'))
    def data = db.getData(12)[0]
    data.booking_id == 12L
    data.user_id == "CATEGORISER_USER"
    data.status == "STARTED"
    data.assigned_user_id == "CATEGORISER_USER"
    data.sequence_no == 1
    data.prison_id == "LEI"
    data.offender_no == "B2345YZ"
    data.start_date.toLocalDate().equals(LocalDate.now())
    data.cat_type.value == "INITIAL"
    data.due_by_date.toLocalDate().equals(LocalDate.of(2019, 8, 29))
  }

  def "Initial cat after an existing cat is not allowed"() {
    when: 'I go to the tasklist page with an existing completed cat'
    db.createDataWithStatus(12, 'APPROVED', JsonOutput.toJson([
      ratings                   : [
      ]]))
    fixture.gotoTasklist()
    go '/tasklist/12' // no clickable button available, so force to page

    then: 'An error is displayed'
    at ErrorPage
    errorSummaryTitle.text() == 'An approved categorisation already exists for this prison term. This prisoner can only be recategorised.'
  }
}
