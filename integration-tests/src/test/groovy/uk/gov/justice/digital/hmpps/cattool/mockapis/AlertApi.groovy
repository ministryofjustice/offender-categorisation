package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse
import static com.github.tomakehurst.wiremock.client.WireMock.get

class AlertsApi extends WireMockRule {

  AlertsApi() {
    super(8089);
  }

  void stubGetEscapeAlerts(String offenderno, boolean onEscapeList, boolean activeOnEscapeList) {
    def responseContent = []
    if (onEscapeList) {
      responseContent += [alertCode: [code: "XER"], activeFrom: "2025-01-01"]
    }
    if (activeOnEscapeList) {
      responseContent += [alertCode: [code: "XEL"], activeFrom: "2025-01-01"]
    }

    this.stubFor(get("/prisoners/" + offenderno + "/alerts?isActive=true&alertCode=XER,XEL,XELH")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody(JsonOutput.toJson([content : responseContent,]))
      ))
  }

  void stubGetActiveOcgmAlerts(String offenderno, boolean hasOcgmAlert) {
    def responseContent = []
    if (hasOcgmAlert) {
      responseContent += [alertCode: [code: "DOCGM"], activeFrom: "2025-01-01"]
    }

    this.stubFor(get("/prisoners/" + offenderno + "/alerts?isActive=true&alertCode=DOCGM")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody(JsonOutput.toJson([content : responseContent,]))
      ))
  }
}
