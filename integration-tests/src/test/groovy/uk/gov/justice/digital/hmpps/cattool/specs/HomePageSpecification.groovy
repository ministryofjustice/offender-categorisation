package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.client.WireMock
import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import com.github.tomakehurst.wiremock.verification.LoggedRequest
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER

class HomePageSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)

  def "The home page for a categoriser is present"() {
    when: 'I go to the home page'

    def now = LocalDate.now()
    def sentenceStartDate = now.plusDays(-3).toString()
    def requiredDate = now.plusDays(7).toString()
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2354XY', 'B2354YZ'], [11, 12], sentenceStartDate)

    fixture.loginAs(ITAG_USER)

    then: 'The home page is displayed'
    at CategoriserHomePage
    prisonNos == ['B2346YZ', 'B2345XY']
    names == ['Hillmob, Ant', 'Pitstop, Penelope']
    days == ['3', '3']
    dates == [requiredDate, requiredDate]
    statuses == ['Awaiting approval', 'Not categorised']
  }

  def "Log out"() {
    given: "I have logged in"
    def now = LocalDate.now()
    def sentenceStartDate = now.plusDays(-3).toString()
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2354XY', 'B2354YZ'], [11, 12], sentenceStartDate)
    fixture.loginAs(ITAG_USER)
    at CategoriserHomePage

    when: "I log out"
    logout()

    then: "I am taken back to the Login page."
    waitFor { $('h1').text() == 'Sign in' }
  }
}
