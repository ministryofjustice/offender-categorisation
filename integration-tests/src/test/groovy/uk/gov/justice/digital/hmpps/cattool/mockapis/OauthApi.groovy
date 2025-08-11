package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount

import static com.github.tomakehurst.wiremock.client.WireMock.*

class OauthApi extends WireMockRule {

  OauthApi(WireMockConfiguration config) {
    super(config.port(9090))
  }

  void stubValidOAuthTokenRequest(UserAccount user, Boolean delayOAuthResponse = false) {

    final accessToken = JwtFactory.token(user.username, user.roles)

    this.stubFor(
      get(urlMatching('/auth/oauth/authorize\\?response_type=code&redirect_uri=.+&state=.+&client_id=categorisationtool'))
        .willReturn(aResponse().withBody('<html><body>Login page<h1>Sign in</h1></body></html>')
        .withHeader('Location', "http://localhost:3000//sign-in/callback?code=codexxxx&state=stateyyyy")
        // .withTransformers("response-template")
      ))
    this.stubFor(
      get(urlMatching('/auth/logout.*'))
        .willReturn(aResponse().withBody('<html><body>Login page<h1>Sign in</h1></body></html>')
      ))

    final tokenResponse = aResponse()
      .withStatus(200)
      .withHeader('Content-Type', 'application/json;charset=UTF-8')
      .withBody(JsonOutput.toJson([
      access_token : accessToken,
      token_type   : 'bearer',
      refresh_token: JwtFactory.token(user.username, user.roles),
      user_name     : user.username,
      expires_in   : 599,
      scope        : 'read write',
      internalUser : true
    ]))

    if (delayOAuthResponse) {
      tokenResponse.withFixedDelay(5000)
    }

    this.stubFor(
      post('/auth/oauth/token').willReturn(tokenResponse))

    this.stubFor(get('/favicon.ico').willReturn(aResponse()))
  }

  void stubHealth() {
    this.stubFor(
      get('/auth/ping')
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'text/plain')
            .withBody("pong")))
  }
}
