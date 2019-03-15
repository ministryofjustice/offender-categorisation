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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage

import java.time.LocalDate
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER_COLLEAGUE
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class HomePageSpecification extends GebReportingSpec {

  def setup() {
    db.clearDb()
  }

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The home page for a categoriser is present"() {
    when: 'I go to the home page as categoriser'

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    def daysSinceSentence11 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate11, now))
    def daysSinceSentence12 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate12, now))
    // 14 days after sentenceStartDate
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

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
    when: 'I go to the home page as supervisor'

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    def daysSinceSentence11 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate11, now))
    def daysSinceSentence12 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate12, now))
    // 14 days after sentenceStartDate
    elite2api.stubUncategorisedForSupervisor()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)

    then: 'The supervisor home page is displayed'
    at SupervisorHomePage
    prisonNos == ['B2345YZ', 'B2345XY']
    names == ['Hillmob, Ant', 'Pitstop, Penelope']
    days == [daysSinceSentence12, daysSinceSentence11]
    dates == ['14/02/2019', '11/02/2019']
    catBy == ['Bugs Bunny', 'Roger Rabbit']
    statuses == ['Categorised as C', 'Categorised as B']
  }

  def "The status of 'Started' for an offender is calculated correctly"() {
    when: 'A user starts a categorisation'

    elite2api.stubUncategorisedNoStatus(678)
    elite2api.stubSentenceData(['ON678'], [678], [LocalDate.now().plusDays(-3).toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(678, "ON678")
    riskProfilerApi.stubGetSocProfile('ON678', 'C', false)
    startButtons[0].click() // selects B2345YZ
    at(new CategoriserTasklistPage(bookingId: '678'))
    headerValue*.text() == ['Hillmob, Ant', 'ON678', '17/02/1970', 'C-04-02', 'Coventry', 'A Felony', 'Another Felony', 'Latvian', '02/02/2020']
    elite2api.stubAssessments(['ON678'])
    elite2api.stubSentenceDataGetSingle('ON678', '2014-11-23')
    elite2api.stubOffenceHistory('ON678')
    offendingHistoryButton.click()
    at(new CategoriserOffendingHistoryPage(bookingId: '12'))
    textArea << 'some text'
    saveButton.click()
    at(new CategoriserTasklistPage(bookingId: '12'))

    then: 'The uncategorised list is displayed with correct status text'

    backLink.click()
    at CategoriserHomePage
    statuses == ['Started (Api User)']

    when: 'A second user views the uncategorised list'

    logout()
    waitFor { $('h1').text() == 'Sign in' }
    fixture.setBrowser(createBrowser())
    oauthApi.resetAll()
    // call to retrieve another users's details for assigned user name
    elite2api.stubGetUserDetails(CATEGORISER_USER, Caseload.LEI.id)
    fixture.loginAs(ITAG_USER_COLLEAGUE)
    at CategoriserHomePage

    then: 'The uncategorised list is displayed with the assigned user text'
    statuses == ["Started (Hpa User)"]
    startButtons[0].text() == 'Edit'
  }

  def "An offender Awaiting approval can be viewed"() {

    db.createDataWithStatus(11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"],
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]
    ]))

    when: 'A user starts a categorisation'

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)

    // 14 days after sentenceStartDate
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage

    elite2api.stubGetOffenderDetails(11, "ON678")
    startButtons[1].click()
    then: 'The view page is displayed'
    at CategoriserViewPage
    categoryDiv.text() contains 'Category for approval is C'
  }


  def "Log out"() {
    given: "I have logged in"
    def now = LocalDate.now()
    def sentenceStartDate = now.plusDays(-3).toString()
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate.toString(), sentenceStartDate.toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage

    when: "I log out"
    logout()

    then: "I am taken back to the Login page."
    waitFor { $('h1').text() == 'Sign in' }
  }
}
