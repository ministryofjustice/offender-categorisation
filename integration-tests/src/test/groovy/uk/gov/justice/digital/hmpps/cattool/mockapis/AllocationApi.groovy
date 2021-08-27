package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput

import static com.github.tomakehurst.wiremock.client.WireMock.*

class AllocationApi extends WireMockRule {

  AllocationApi() {
    super(8083)
  }

  void stubGetPomByOffenderNo() {
    this.stubFor(
      get(urlMatching("/api/allocation/\\w+"))
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              primary_pom  : [name: "Humperdinck, Engelbert", staff_id: 12345],
              secondary_pom: [name: "Depp, Johnny", staff_id: 6789],
            ])
            )
        )
    )
  }

  void stubHealth() {
    this.stubFor(
      get('/health')
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'text/plain')
            .withBody("Everything is fine.")))
  }
}
