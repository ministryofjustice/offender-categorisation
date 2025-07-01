package uk.gov.justice.digital.hmpps.cattool.mockapis;

import com.github.tomakehurst.wiremock.junit.WireMockRule;
import groovy.json.JsonOutput;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;

public class AlertsApi extends WireMockRule {

  public AlertsApi() {
    super(8089);
  }

  public void stubGetAlerts(String offenderno, boolean onEscapeList, boolean activeOnEscapeList) {
    this.stubFor(get("/prisoners/" + offenderno + "/alerts?isActive=true&alertCode=XER,XEL,XELH")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody(JsonOutput.toJson("{content: [{alertCode: {code: \"XER\"}, activeFrom: \"2025-01-01\"}, {alertCode: {code: \"XEL\"}, activeFrom: \"2025-01-01\"}]}"))
      ));
  }
}
