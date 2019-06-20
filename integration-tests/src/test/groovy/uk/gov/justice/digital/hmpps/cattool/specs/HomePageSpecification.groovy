package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserAwaitingApprovalViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage

import java.time.LocalDate
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER_COLLEAGUE
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.MULTIROLE_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class HomePageSpecification extends GebReportingSpec {

  def setup() {
    db.clearDb()
  }

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The home page for a categoriser is present"() {
    when: 'I go to the home page as categoriser'

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    def daysSinceSentence11 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate11, now))
    def daysSinceSentence12 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate12, now))
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(CATEGORISER_USER)

    then: 'The categoriser home page is displayed'
    at CategoriserHomePage
    prisonNos == ['B2345XY','B2345YZ']
    names == ['Pitstop, Penelope', 'Hillmob, Ant']
    days == [daysSinceSentence12, daysSinceSentence11]
    dates == ['14/02/2019','11/02/2019']
    statuses == ['Not categorised', 'Awaiting approval']
  }

  def "The home page for a supervisor is present"() {
    // Only one of the prisoners is in the DB
    db.createDataWithStatus(11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]
    ]))
    when: 'I go to the home page as supervisor'

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    def daysSinceSentence11 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate11, now))
    def daysSinceSentence12 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate12, now))
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedForSupervisor()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)

    then: 'The supervisor home page is displayed'
    at SupervisorHomePage
    prisonNos == ['B2345YZ', 'B2345XY']
    names == ['Hillmob, Ant', 'Pitstop, Penelope']
    days == [daysSinceSentence12, daysSinceSentence11]
    dates == ['14/02/2019', '11/02/2019']
    catBy == ['Bugs Bunny', 'Roger Rabbit']
    statuses == ['PNOMIS', 'B']
    catTypes == ['', 'Initial']
    !multipleRoleDiv.isDisplayed()
  }

  def "The home page for a recategoriser is present"() {
    when: 'I go to the home page as recategoriser'

    elite2Api.stubRecategorise()

    fixture.loginAs(RECATEGORISER_USER)

    then: 'The recategoriser home page is displayed'
    at RecategoriserHomePage
    prisonNos == ['B2345XY','B2345YZ']
    names == ['Pitstop, Penelope', 'Hillmob, Ant']
    dates == ['25/07/2019','27/07/2019']
    reasons == ['Review due', 'Review due']
    statuses == ['Not started', 'Not started']
    startButtons[0].text() == 'Start'
  }

  def "The home page for a multiple role user is present"() {

    db.createDataWithStatus(11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]
    ]))
    when: 'I go to the home page as multi-role user (categoriser and supervisor)'

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    elite2Api.stubUncategorisedForSupervisor()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(MULTIROLE_USER)

    then: 'The supervisor home page is displayed as it has precedence over the categoriser home page'
    at SupervisorHomePage
    elite2Api.stubUncategorised()
    multipleRoleDiv.isDisplayed()
    roleSwitchSelect.find('option', value: 'supervisor').text() == 'Supervisor'
    roleSwitchSelect.find('option', value: 'categoriser').text() == 'Categoriser'

    when: 'I select categoriser from the Current role select box'
    roleSwitchSelect = "categoriser"

    then: 'The categoriser home page is displayed'
    at CategoriserHomePage

    when: 'I select supervisor from the Current role select box'
    elite2Api.stubUncategorisedForSupervisor()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    roleSwitchSelect = "supervisor"

    then: 'The new role - supervisor home page is displayed'
    at SupervisorHomePage
  }


  def "The status of 'Started' for an offender is calculated correctly"() {
    when: 'A user starts a categorisation'

    elite2Api.stubUncategorisedNoStatus(678)
    elite2Api.stubSentenceData(['ON678'], [678], [LocalDate.now().plusDays(-3).toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(678, "ON678")
    riskProfilerApi.stubGetSocProfile('ON678', 'C', false)
    startButtons[0].click() // selects B2345YZ
    at(new TasklistPage(bookingId: '678'))
    headerValue*.text() == ['Hillmob, Ant', 'ON678', '17/02/1970', 'C-04-02', 'Coventry', 'A Felony', 'Another Felony', 'Latvian', '02/02/2020']
    elite2Api.stubAssessments(['ON678'])
    elite2Api.stubSentenceDataGetSingle('ON678', '2014-11-23')
    elite2Api.stubOffenceHistory('ON678')
    offendingHistoryButton.click()
    at(new CategoriserOffendingHistoryPage(bookingId: '12'))
    previousConvictionsNo.click()
    saveButton.click()
    at(new TasklistPage(bookingId: '12'))

    then: 'The uncategorised list is displayed with correct status text'

    backLink.click()
    at CategoriserHomePage
    statuses == ['Started (Api User)']

    when: 'A second user views the uncategorised list'

    fixture.logout()

    fixture.setBrowser(createBrowser())
    oauthApi.resetAll()
    // call to retrieve another users's details for assigned user name
    elite2Api.stubGetUserDetails(CATEGORISER_USER, Caseload.LEI.id)
    fixture.loginAs(ITAG_USER_COLLEAGUE)
    at CategoriserHomePage

    then: 'The uncategorised list is displayed with the assigned user text'
    statuses == ["Started (Hpa User)"]
    startButtons[0].text() == 'Edit'
  }

  def "An offender Awaiting approval can be viewed"() {

    db.createDataWithStatus(11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"],
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]
    ]))

    when: 'A user starts a categorisation'

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)

    // 14 days after sentenceStartDate
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage

    elite2Api.stubGetOffenderDetails(11, "ON678")
    startButtons[1].click()
    then: 'The view page is displayed'
    at CategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is C'
  }

  def "Log out"() {
    given: "I have logged in"
    def now = LocalDate.now()
    def sentenceStartDate = now.plusDays(-3).toString()
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate.toString(), sentenceStartDate.toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage

    when: "I log out"
    fixture.logout()

    then: "I am taken back to the Login page."
    $('h1').text() == 'Sign in'
  }

  def "Deep urls work"() {
    when: "I try to go direct to the categoriser Done page"
    fixture.stubLogin(CATEGORISER_USER)
    go 'categoriserDone'

    then: "the login page is shown"
    waitFor { $('h1').text() == 'Sign in' }

    when: "I login"
    elite2Api.stubCategorised([])
    fixture.simulateLogin()

    then:"I arrive at the originally specified page"
    at CategoriserDonePage
  }
}
