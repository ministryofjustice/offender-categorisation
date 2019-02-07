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
      get("/soc/${offenderno}")
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
      get("/violence/${offenderno}")
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
          displayAssaults            : displayAssaults
        ]))))
  }

  void stubGetEscapeProfile(String offenderno, String category, boolean onEscapeList, boolean activeOnEscapeList) {
    this.stubFor(
      get("/escape/${offenderno}")
        .willReturn(
        aResponse()
          .withStatus(200)
          .withHeader('Content-Type', 'application/json')
          .withBody(JsonOutput.toJson([
          nomsId                   : offenderno,
          riskType                 : 'ESCAPE',
          provisionalCategorisation: category,
          onEscapeList             : onEscapeList,
          activeOnEscapeList       : activeOnEscapeList
        ]))))
  }

  void stubGetExtremismProfile(String offenderno, String category, boolean increasedRisk, boolean notifyRegionalCTLead) {
    this.stubFor(
      get("/extremism/${offenderno}?previousOffences=false")
        .willReturn(
        aResponse()
          .withStatus(200)
          .withHeader('Content-Type', 'application/json')
          .withBody(JsonOutput.toJson([
          nomsId                   : offenderno,
          riskType                 : 'EXTREMISM',
          provisionalCategorisation: category,
          increasedRisk            : increasedRisk,
          notifyRegionalCTLead     : notifyRegionalCTLead
        ]))))
  }
}
