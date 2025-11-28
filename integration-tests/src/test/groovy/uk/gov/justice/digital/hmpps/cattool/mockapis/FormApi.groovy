package uk.gov.justice.digital.hmpps.cattool.mockapis;


import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse
import static com.github.tomakehurst.wiremock.client.WireMock.get

public class FormApi extends WireMockRule {

  FormApi() {
    super(8088);
  }

  void stubGetViperData(String prisonerNumber, boolean aboveThreshold) {
    this.stubFor(get("/risk/viper/${prisonerNumber}")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody(JsonOutput.toJson([aboveThreshold : aboveThreshold]))
      ))
  }
}
