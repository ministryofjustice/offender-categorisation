package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage

import java.time.LocalDate
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.API_TEST_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER_COLLEAGUE

class HomePageSpecification extends GebReportingSpec {

  def setup() {
    db.clearDb()
  }

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The home page for a categoriser is present"() {
    when: 'I go to the home page'

    def now = LocalDate.now()
    def sentenceStartDate = LocalDate.of(2019, 1, 28)
    def daysSinceSentence = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate, now))
    def requiredDate = '2019-02-11' // 14 days after sentenceStartDate
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], sentenceStartDate.toString())

    fixture.loginAs(ITAG_USER)

    then: 'The home page is displayed'
    at CategoriserHomePage
    prisonNos == ['B2345YZ', 'B2345XY']
    names == ['Hillmob, Ant', 'Pitstop, Penelope']
    days == [daysSinceSentence, daysSinceSentence]
    dates == [requiredDate, requiredDate]
    statuses == ['Awaiting approval', 'Not categorised']
  }

  def "The status of 'Started' for an offender is calculated correctly"() {
    when: 'A user starts a categorisation'

    elite2api.stubUncategorisedNoStatus(678)
    elite2api.stubSentenceData(['ON678'], [678], LocalDate.now().plusDays(-3).toString())
    fixture.loginAs(ITAG_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(678, "ON678")
    startButtons[0].click() // selects B2345YZ
    at(new CategoriserTasklistPage(bookingId: '678'))
    headerValue*.text() == ['Hillmob, Ant', 'ON678', '17/02/1970', 'C-04-02', 'Coventry', 'A Felony', 'Another Felony', 'Latvian', '02/02/2020']
    elite2api.stubAssessments(['ON678'])
    elite2api.stubSentenceDataGetSingle('ON678', '2014-11-23')
    offendingHistoryButton.click()
    at(new CategoriserOffendingHistoryPage(bookingId: '12'))
    saveButton.click()
    at(new CategoriserTasklistPage(bookingId: '678'))

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
    elite2api.stubGetUserDetails(ITAG_USER, Caseload.LEI.id)
    fixture.loginAs(ITAG_USER_COLLEAGUE)
    at CategoriserHomePage

    then: 'The uncategorised list is displayed with the assigned user text'
    statuses == ['Started (Api User)']

  }

  def "Log out"() {
    given: "I have logged in"
    def now = LocalDate.now()
    def sentenceStartDate = now.plusDays(-3).toString()
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], sentenceStartDate)
    fixture.loginAs(ITAG_USER)
    at CategoriserHomePage

    when: "I log out"
    logout()


    then: "I am taken back to the Login page."
    waitFor { $('h1').text() == 'Sign in' }
  }
}
