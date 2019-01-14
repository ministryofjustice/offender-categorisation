package uk.gov.justice.digital.hmpps.cattool.model

import com.github.tomakehurst.wiremock.client.WireMock
import com.github.tomakehurst.wiremock.verification.LoggedRequest
import geb.Browser
import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER

class TestFixture {

  Browser browser
  Elite2Api elite2Api
  OauthApi oauthApi

  UserAccount currentUser

  TestFixture(Browser browser, Elite2Api elite2Api, OauthApi oauthApi) {
    this.browser = browser
    this.elite2Api = elite2Api
    this.oauthApi = oauthApi
  }

  def loginAs(UserAccount user) {
    currentUser = user
    elite2Api.stubHealth()
    oauthApi.stubValidOAuthTokenRequest currentUser
    elite2Api.stubGetMyDetails currentUser
    elite2Api.stubGetMyCaseloads currentUser.caseloads

    simulateLogin()
  }

  private void simulateLogin() {
    browser.go '/' // Redirect to /oauth/authorise and wiremock serves a dummy login page
    browser.waitFor { browser.$('h1').text() == 'Sign in' }
    List<LoggedRequest> requests = oauthApi.getAllServeEvents()
    print JsonOutput.toJson(requests)
    // Capture 'state' param for passport ( -1 = last server request)
    def state = requests[-1].request.queryParams['state'].values[0]
    // Simulate auth server calling the callback, which then gets a token (from wiremock) and goes to homepage
    browser.go "/login/callback?code=codexxxx&state=$state"
  }
}
