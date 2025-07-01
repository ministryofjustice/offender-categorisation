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
        .withBody(JsonOutput.toJson(new AlertsApiContent(new Alert[] {new Alert(new AlertCode("XER"), "2025-01-01"), new Alert(new AlertCode("XEL"), "2025-01-01")})))
      ));
  }
}

class AlertCode {
  public String code;

  public AlertCode(String code) {
    this.code = code;
  }
}

class Alert {
  public AlertCode alertCode;
  public String activeFrom;
  public Alert(AlertCode alertCode, String activeFrom) {
    this.alertCode = alertCode;
    this.activeFrom = activeFrom;
  }
}
class AlertsApiContent {
  public Alert[] content;
  public AlertsApiContent(Alert[] content) {
    this.content = content;
  }
}
