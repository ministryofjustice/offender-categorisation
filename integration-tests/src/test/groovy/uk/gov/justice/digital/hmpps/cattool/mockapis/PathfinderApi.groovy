package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse
import static com.github.tomakehurst.wiremock.client.WireMock.get

class PathfinderApi extends WireMockRule {
    
    PathfinderApi() {
        super(8081);
    }

    void stubGetExtremismProfile(String offenderNo, Number band) {
        this.stubFor(get("/pathfinder/offender/" + offenderNo)
        .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'application/json')
        .withBody(JsonOutput.toJson([band : band]))))
    }
}