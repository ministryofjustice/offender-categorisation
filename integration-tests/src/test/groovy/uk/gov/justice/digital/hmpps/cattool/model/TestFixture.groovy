package uk.gov.justice.digital.hmpps.cattool.model

import com.github.tomakehurst.wiremock.verification.LoggedRequest
import geb.Browser
import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class TestFixture {

  Browser browser
  Elite2Api elite2Api
  RiskProfilerApi riskProfilerApi
  OauthApi oauthApi

  UserAccount currentUser

  public static final defaultRatingsB = [
    offendingHistory: [previousConvictions: "some convictions"],
    securityInput   : [securityInputNeeded: "No"],
    furtherCharges  : [furtherCharges: "No"],
    violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
    escapeRating    : [escapeOtherEvidence: "Yes"],
    extremismRating : [previousTerrorismOffences: "Yes"]
  ]

  public static final defaultRatingsC = [
    offendingHistory: [previousConvictions: "some convictions"],
    securityInput   : [securityInputNeeded: "No"],
    furtherCharges  : [furtherCharges: "No"],
    violenceRating  : [highRiskOfViolence: "No", seriousThreat: "No"],
    escapeRating    : [escapeOtherEvidence: "No"],
    extremismRating : [previousTerrorismOffences: "No"]
  ]

  public static final defaultOpenConditions = [
    earliestReleaseDate: ['threeOrMoreYears': 'No'],
    foreignNational    : ['isForeignNational': 'No'],
    riskOfHarm         : ['seriousHarm': 'No'],
    furtherCharges     : ['increasedRisk': 'No', 'furtherChargesText': 'some charges,furtherChargesText details'],
    riskLevels         : ['likelyToAbscond': 'No']
  ]

  TestFixture(Browser browser, Elite2Api elite2Api, OauthApi oauthApi, RiskProfilerApi riskProfilerApi1) {
    this.browser = browser
    this.elite2Api = elite2Api
    this.riskProfilerApi = riskProfilerApi1
    this.oauthApi = oauthApi
  }

  def loginAs(UserAccount user) {
    stubLogin(user)
    // Redirect to /oauth/authorise and wiremock serves a dummy login page
    browser.go '/'
    simulateLogin()
  }

  def stubLogin(UserAccount user) {
    oauthApi.resetRequests()
    currentUser = user
    elite2Api.stubHealth()
    oauthApi.stubValidOAuthTokenRequest currentUser
    elite2Api.stubGetMyDetails currentUser
    elite2Api.stubGetMyCaseloads currentUser.caseloads
  }

  def gotoTasklist(transferToSecurity = false) {
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])

    loginAs(CATEGORISER_USER)
    browser.at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', transferToSecurity)
    browser.selectFirstPrisoner()
  }

  def simulateLogin() {
    browser.waitFor { browser.$('h1').text() == 'Sign in' }
    List<LoggedRequest> requests = oauthApi.getAllServeEvents()
    // print JsonOutput.toJson(requests)
    // Capture 'state' param for passport ( -1 = last server request)
    def stateParam = requests[-1].request.queryParams['state']
    def state = stateParam ? stateParam.values[0] : requests[-2].request.queryParams['state'].values[0]
    // Simulate auth server calling the callback, which then gets a token (from wiremock) and goes to homepage
    browser.go "/login/callback?code=codexxxx&state=$state"
  }
}
