package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse
import static com.github.tomakehurst.wiremock.client.WireMock.get

class RiskProfilerApi extends WireMockRule {

  RiskProfilerApi() {
    super(8082)
  }

  void stubForTasklists(String offenderno, String category, boolean transferToSecurity = false) {
    stubGetSocProfile(offenderno, category, transferToSecurity)
  }

  void stubGetSocProfile(String offenderno, String category, boolean transferToSecurity) {
    this.stubFor(get("/risk-profile/soc/${offenderno}")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'application/json')
        .withBody(JsonOutput.toJson([nomsId                   : offenderno,
                                     riskType                 : 'SOC',
                                     provisionalCategorisation: category,
                                     transferToSecurity       : transferToSecurity]))))
  }

  void stubGetEscapeProfile(String offenderno, String category, boolean onEscapeList, boolean activeOnEscapeList) {
    this.stubFor(get("/risk-profile/escape/${offenderno}")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'application/json')
        .withBody(JsonOutput.toJson([nomsId                   : offenderno,
                                     riskType                 : 'ESCAPE',
                                     provisionalCategorisation: category,
                                     activeEscapeList         : onEscapeList,
                                     activeEscapeRisk         : activeOnEscapeList,
                                     escapeListAlerts         : [[alertCode           : "XEL",
                                                                  alertCodeDescription: "Escape List",
                                                                  comment             : "First xel comment",
                                                                  dateCreated         : "2016-09-14",
                                                                  expired             : false,
                                                                  active              : true],
                                                                 [alertCode           : "XEL",
                                                                  alertCodeDescription: "Escape List",
                                                                  comment             : '''
Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text
 comment with lengthy text comment with lengthy text comment with lengthy text
  comment with lengthy text comment with lengthy text comment with lengthy text
   comment with lengthy text comment with lengthy text comment with lengthy text
''',
                                                                  dateCreated         : "2016-09-15",
                                                                  expired             : true,
                                                                  active              : false]],
                                     escapeRiskAlerts         : [[alertCode           : "XER",
                                                                  alertCodeDescription: "Escape Risk",
                                                                  comment             : "First xer comment",
                                                                  dateCreated         : "2016-09-16",
                                                                  expired             : false,
                                                                  active              : true],]]))))
  }

  void stubGetProfileWomenEscapeAlert(String offenderno, String category, boolean onEscapeList, boolean activeOnEscapeList) {
    this.stubFor(get("/risk-profile/escape/${offenderno}")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'application/json')
        .withBody(JsonOutput.toJson([nomsId                   : offenderno,
                                     riskType                 : 'ESCAPE',
                                     provisionalCategorisation: category,
                                     activeEscapeList         : onEscapeList,
                                     activeEscapeRisk         : activeOnEscapeList,
                                     escapeListAlerts         : [[alertCode           : "XEL",
                                                                  alertCodeDescription: "Escape List",
                                                                  comment             : "First xel comment",
                                                                  dateCreated         : "2016-09-14",
                                                                  expired             : false,
                                                                  active              : true],
                                                                 [alertCode           : "XEL",
                                                                  alertCodeDescription: "Escape List",
                                                                  comment             : '''
Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text
 comment with lengthy text comment with lengthy text comment with lengthy text
  comment with lengthy text comment with lengthy text comment with lengthy text
   comment with lengthy text comment with lengthy text comment with lengthy text
''',
                                                                  dateCreated         : "2016-09-15",
                                                                  expired             : true,
                                                                  active              : false]],
                                     escapeRiskAlerts         : [[alertCode           : "XER",
                                                                  alertCodeDescription: "Escape Risk",
                                                                  comment             : "First xer comment",
                                                                  dateCreated         : "2016-09-16",
                                                                  expired             : false,
                                                                  active              : true],]]))))
  }

  void stubHealth() {
    this.stubFor(get('/ping')
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'text/plain')
        .withBody("pong")))
  }

  void stubDelayedError(url, status) {
    this.stubFor(get(url)
      .willReturn(aResponse()
        .withStatus(status)
        .withFixedDelay(3000)))
  }
}
