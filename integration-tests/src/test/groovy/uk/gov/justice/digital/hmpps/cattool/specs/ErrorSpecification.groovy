package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.ErrorPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class ErrorSpecification extends GebReportingSpec {

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

  def "The error page is displayed when an unexpected error occurs"() {
    when: 'A 500 error occurs in an API call'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceDataError()
    fixture.loginAs(SUPERVISOR_USER)

    then: 'the error page is displayed'
    at new ErrorPage(url: 'supervisorHome')
    errorSummaryTitle.text() == 'A test error'
    errorText.text() == 'status 500'
  }

  def "The auth page is displayed when a user does not have the correct role for the url"() {
    when: 'The user hits a page not for their role'
    elite2Api.stubUncategorisedAwaitingApproval()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    fixture.loginAs(SUPERVISOR_USER)
    go 'tasklist/12'

    then: 'the auth error page is displayed'
    at new ErrorPage(url: 'tasklist/12')
    errorSummaryTitle.text() == 'Unauthorised access: required role not present'
    errorText.text() == 'status 403'

    when: 'The user hits a nonexistent page'
    to SupervisorHomePage
    go 'idontexist/12'

    then: 'the auth error page is displayed'
    at new ErrorPage(url: 'idontexist/12')
    errorSummaryTitle.text() == 'Url not recognised'
    errorText.text() == 'status 403'
  }
}
