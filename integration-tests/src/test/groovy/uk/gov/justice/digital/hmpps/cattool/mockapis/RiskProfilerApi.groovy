package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput

import static com.github.tomakehurst.wiremock.client.WireMock.*

class RiskProfilerApi extends WireMockRule {

  RiskProfilerApi() {
    super(8082)
  }

  void stubGetSocProfile(String offenderno, String category, boolean transferToSecurity) {
    this.stubFor(
      get("/risk-profile/soc/${offenderno}")
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              nomsId                   : offenderno,
              riskType                 : 'SOC',
              provisionalCategorisation: category,
              transferToSecurity       : transferToSecurity
            ]))))
  }

  void stubGetViolenceProfile(String offenderno, String category, boolean veryHighRiskViolentOffender, boolean notifySafetyCustodyLead, boolean displayAssaults) {
    this.stubFor(
      get("/risk-profile/violence/${offenderno}")
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              nomsId                     : offenderno,
              riskType                   : 'VIOLENCE',
              provisionalCategorisation  : category,
              veryHighRiskViolentOffender: veryHighRiskViolentOffender,
              notifySafetyCustodyLead    : notifySafetyCustodyLead,
              displayAssaults            : displayAssaults,
              numberOfAssaults           : 5,
              numberOfSeriousAssaults    : 2,
              numberOfNonSeriousAssaults : 3
            ]))))
  }

  void stubGetEscapeProfile(String offenderno, String category, boolean onEscapeList, boolean activeOnEscapeList) {
    this.stubFor(
      get("/risk-profile/escape/${offenderno}")
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              nomsId                   : offenderno,
              riskType                 : 'ESCAPE',
              provisionalCategorisation: category,
              activeEscapeList         : onEscapeList,
              activeEscapeRisk         : activeOnEscapeList,
              escapeListAlerts         : [
                [
                  alertCode           : "XEL",
                  alertCodeDescription: "Escape List",
                  comment             : "First xel comment",
                  dateCreated         : "2016-09-14",
                  expired             : false,
                  active              : true
                ],
                [
                  alertCode           : "XEL",
                  alertCodeDescription: "Escape List",
                  comment             : '''
Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text
 comment with lengthy text comment with lengthy text comment with lengthy text
  comment with lengthy text comment with lengthy text comment with lengthy text
   comment with lengthy text comment with lengthy text comment with lengthy text
''',
                  dateCreated         : "2016-09-15",
                  expired             : true,
                  active              : false
                ]
              ],
              escapeRiskAlerts         : [
                [
                  alertCode           : "XER",
                  alertCodeDescription: "Escape Risk",
                  comment             : "First xer comment",
                  dateCreated         : "2016-09-16",
                  expired             : false,
                  active              : true
                ],
              ]
            ]))))
  }

  void stubGetExtremismProfile(String offenderno, String category, boolean increasedRisk, boolean notifyRegionalCTLead, boolean previousOffences = false) {
    this.stubFor(
      get("/risk-profile/extremism/$offenderno?previousOffences=$previousOffences")
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              nomsId                   : offenderno,
              riskType                 : 'EXTREMISM',
              provisionalCategorisation: category,
              increasedRiskOfExtremism : increasedRisk,
              notifyRegionalCTLead     : notifyRegionalCTLead
            ]))))
  }

  void stubGetLifeProfile(String offenderno, String category) {
    this.stubFor(
      get("/risk-profile/life/$offenderno")
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              nomsId                   : offenderno,
              riskType                 : 'LIFE',
              provisionalCategorisation: category,
            ]))))
  }

  void stubHealth() {
    this.stubFor(
      get('/ping')
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'text/plain')
            .withBody("pong")))
  }

  void stubDelayedError(url, status) {
    this.stubFor(
      get(url)
        .willReturn(
          aResponse()
            .withStatus(status)
            .withFixedDelay(3000)))
  }
}
