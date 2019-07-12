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
    db.createDataWithStatus(-2, 32, 'STARTED', '{}')
    db.createDataWithStatus(-3, 33, 'AWAITING_APPROVAL', '{}')
    db.createDataWithStatus(-4, 34, 'APPROVED', '{}')
    db.createDataWithStatus(-5, 36, 'STARTED', '{}')
    db.createDataWithStatus(-6, 37, 'AWAITING_APPROVAL', '{}')
    db.createDataWithStatus(-7, 38, 'APPROVED', '{}')
    db.createDataWithStatus(-8, 39, 'SUPERVISOR_BACK', '{}')

    when: 'I go to the home page as categoriser'

    def now = LocalDate.now()
    def sentenceStartDate31 = LocalDate.of(2019, 3, 18)
    def sentenceStartDate32 = LocalDate.of(2019, 3, 14)
    def sentenceStartDate33 = LocalDate.of(2019, 3, 4)
    def sentenceStartDate34 = LocalDate.of(2019, 2, 28)
    def sentenceStartDate35 = LocalDate.of(2019, 2, 8)
    def sentenceStartDate36 = LocalDate.of(2019, 2, 4)
    def sentenceStartDate37 = LocalDate.of(2019, 1, 31)
    def sentenceStartDate38 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate39 = LocalDate.of(2019, 1, 23)
    def daysSinceSentence31 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate31, now))
    def daysSinceSentence32 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate32, now))
    def daysSinceSentence33 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate33, now))
    def daysSinceSentence34 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate34, now))
    def daysSinceSentence35 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate35, now))
    def daysSinceSentence36 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate36, now))
    def daysSinceSentence37 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate37, now))
    def daysSinceSentence38 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate38, now))
    def daysSinceSentence39 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate39, now))
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedFull()
    elite2Api.stubSentenceData(['B0031AA', 'B0032AA', 'B0033AA', 'B0034AA', 'B0035AA', 'B0036AA', 'B0037AA', 'B0038AA', 'B0039AA'],
      [31, 32, 33, 34, 35, 36, 37, 38, 39],
      [sentenceStartDate31.toString(), sentenceStartDate32.toString(), sentenceStartDate33.toString(), sentenceStartDate34.toString(),
       sentenceStartDate35.toString(), sentenceStartDate36.toString(), sentenceStartDate37.toString(), sentenceStartDate38.toString(), sentenceStartDate39.toString()],
    )

    fixture.loginAs(CATEGORISER_USER)

    then: 'The categoriser home page is displayed'
    at CategoriserHomePage
    prisonNos == ['B0031AA', 'B0032AA', 'B0033AA', 'B0034AA', 'B0035AA', 'B0036AA', 'B0037AA', 'B0038AA', 'B0039AA']
    names == ['Missing, Awaiting', 'Started, Awaiting', 'Awaiting, Awaiting', 'Approved, Awaiting', 'Missing, Uncategorised',
              'Started, Uncategorised', 'Awaiting, Uncategorised', 'Approved, Uncategorised', 'Supervisor_back, Awaiting']
    days == [daysSinceSentence31, daysSinceSentence32, daysSinceSentence33, daysSinceSentence34, daysSinceSentence35, daysSinceSentence36, daysSinceSentence37, daysSinceSentence38, daysSinceSentence39]
    dates == ['01/04/2019', '28/03/2019', '18/03/2019', '14/03/2019', '22/02/2019', '18/02/2019', '14/02/2019', '11/02/2019', '06/02/2019']
    statuses == ['Awaiting approval', 'Started (Api User)', 'Awaiting approval', 'Approved', 'Not categorised', 'Started (Api User)', 'Awaiting approval', 'Approved', 'Back from Supervisor']
    startButtons*.text() == ['PNOMIS', 'PNOMIS', 'View', 'PNOMIS', 'Start', 'Edit', 'PNOMIS', 'PNOMIS', 'Edit']
  }

  def "The home page for a supervisor is present"() {
    // Only some of the prisoners are in the DB
    // Refer to table in https://dsdmoj.atlassian.net/browse/CAT-254
    db.createDataWithStatus(-2, 32, 'STARTED', '{}')
    db.createDataWithStatus(-3, 33, 'AWAITING_APPROVAL', '{}')
    db.createDataWithStatus(-4, 34, 'APPROVED', '{}')
    db.createDataWithIdAndStatusAndCatType(-6, 36, 'AWAITING_APPROVAL', '{}', 'RECAT')

    when: 'I go to the home page as supervisor'

    def now = LocalDate.now()
    def sentenceStartDate31 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate32 = LocalDate.of(2019, 1, 31)
    def sentenceStartDate33 = LocalDate.of(2019, 2, 4)
    def sentenceStartDate34 = LocalDate.of(2019, 2, 8)
    def daysSinceSentence31 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate31, now))
    def daysSinceSentence32 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate32, now))
    def daysSinceSentence33 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate33, now))
    def daysSinceSentence34 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate34, now))
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedForSupervisorFull()
    elite2Api.stubSentenceData(['B0031AA', 'B0032AA', 'B0033AA', 'B0034AA'], [31, 32, 33, 34],
      [sentenceStartDate31.toString(), sentenceStartDate32.toString(), sentenceStartDate33.toString(), sentenceStartDate34.toString()])

    fixture.loginAs(SUPERVISOR_USER)

    then: 'The supervisor home page is displayed'
    at SupervisorHomePage
    prisonNos == ['B0036AA', 'B0034AA', 'B0033AA', 'B0032AA', 'B0031AA']
    names == ['Recat, Mr', 'Approved, Awaiting', 'Awaiting, Awaiting', 'Started, Awaiting', 'Missing, Awaiting']
    days == ['', daysSinceSentence34, daysSinceSentence33, daysSinceSentence32, daysSinceSentence31]
    dates == ['', '22/02/2019', '18/02/2019', '14/02/2019', '11/02/2019']
    nextReviewDate == ['29/03/2020', '', '', '', '15/01/2019']
    catBy == ['Roger Rabbit', 'Bugs Bunny', 'Roger Rabbit', 'Bugs Bunny', 'Roger Rabbit']
    statuses == ['B', 'C', 'B', 'C', 'B']
    catTypes == ['Recat', 'Initial', 'Initial', 'Initial', '']
    startButtons*.text() == ['Start', 'PNOMIS', 'Start', 'PNOMIS', 'PNOMIS']
    !multipleRoleDiv.isDisplayed()
  }

  def "The home page for a recategoriser is present"() {
    when: 'I go to the home page as recategoriser'

    elite2Api.stubRecategorise()

    fixture.loginAs(RECATEGORISER_USER)

    then: 'The recategoriser home page is displayed'
    at RecategoriserHomePage
    prisonNos == ['B2345XY', 'C0001AA', 'B2345YZ', 'C0002AA']
    names == ['Pitstop, Penelope', 'Tim, Tiny', 'Hillmob, Ant', 'Mole, Adrian']
    dates == ['25/07/2019', '26/07/2019', '27/07/2019', '15/08/2019']
    reasons == ['Review due', 'Age 21', 'Review due', 'Age 21']
    statuses == ['Not started', 'Not started', 'Not started', 'Not started']
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
    elite2Api.stubUncategorisedAwaitingApproval()
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
    elite2Api.stubUncategorisedAwaitingApproval()
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
      ratings    : [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"],
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "B", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]
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
    categoryDiv.text() contains 'B\nWarning\nCategory for approval is B'
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

    then: "I arrive at the originally specified page"
    at CategoriserDonePage
  }
}
