package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonBuilder
import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.mockapis.mockResponses.*
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount

import static com.github.tomakehurst.wiremock.client.WireMock.*

class RiskProfilerApi extends WireMockRule {

  RiskProfilerApi() {
    super(8082)
  }

  void stubGetSocProfile(String offenderno, String cat, boolean transferToSecurity, String riskType) {
    this.stubFor(
      get("/soc/${offenderno}")
        .willReturn(
        aResponse()
          .withStatus(200)
          .withHeader('Content-Type', 'application/json')
          .withBody(JsonOutput.toJson([
          nomsId: offenderno,
          riskType: riskType,
          provisionalCategorisation: cat,
          transferToSecurity: transferToSecurity
        ]))))
  }
}
