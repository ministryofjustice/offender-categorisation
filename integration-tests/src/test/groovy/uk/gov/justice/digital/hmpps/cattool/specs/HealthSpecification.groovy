package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import groovyx.net.http.HttpBuilder
import groovyx.net.http.HttpException
import org.junit.Rule
import spock.lang.Specification

import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi

import static groovyx.net.http.HttpBuilder.configure

class HealthSpecification extends Specification {

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  HttpBuilder http

  def setup() {
    http = configure {
      request.uri = 'http://localhost:3000/health'
    }
  }

  def "Health page reports ok"() {

    given:
    riskProfilerApi.stubHealth()
    elite2Api.stubHealth()
    oauthApi.stubHealth()

    when:
    def response = this.http.get()
    then:
    response.uptime > 0.0
    response.name == "offender-categorisation"
    !response.version.isEmpty()
    response.api == [auth: 'UP', elite2: 'UP', riskProfiler: 'UP']
  }

  def "Health page reports API down"() {

    given:
    riskProfilerApi.stubDelayedError('/ping', 500)
    elite2Api.stubHealth()
    oauthApi.stubHealth()

    when:
    def response
    try {
      response = http.get()
    } catch (HttpException e) {
      response = e.body
    }

    then:
    response.name == "offender-categorisation"
    !response.version.isEmpty()
    response.api == [auth: 'UP', elite2: 'UP', riskProfiler: [timeout: 1000, code: 'ECONNABORTED', errno: 'ETIMEDOUT', retries: 2]]
  }
}
