package uk.gov.justice.digital.hmpps.cattool.specs


import groovyx.net.http.HttpBuilder
import groovyx.net.http.HttpException

import static groovyx.net.http.HttpBuilder.configure

class HealthSpecification extends AbstractSpecification {

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
    allocationApi.stubHealth()

    when:
    def response = this.http.get()
    then:
    response.uptime > 0.0
    response.name == "offender-categorisation"
    !response.version.isEmpty()
    response.api == [auth: 'UP', elite2: 'UP', riskProfiler: 'UP', allocation: 'UP']
  }

  def "Health page reports API down"() {

    given:
    riskProfilerApi.stubDelayedError('/ping', 500)
    elite2Api.stubHealth()
    oauthApi.stubHealth()
    allocationApi.stubHealth()

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
    response.api == [auth: 'UP', elite2: 'UP', riskProfiler: [timeout: 1000, code: 'ECONNABORTED', errno: 'ETIMEDOUT', retries: 2], allocation: 'UP']
  }
}
