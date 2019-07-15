package uk.gov.justice.digital.hmpps.cattool.specs.recat

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonSlurper
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.HigherSecurityReviewPage

class HigherSecurityReviewSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  def setup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    // higherSecurityReviewButton.click()
    to HigherSecurityReviewPage, '12'

    at HigherSecurityReviewPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at HigherSecurityReviewPage
    errorSummaries*.text() == ['Please enter behaviour details', 'Please enter steps details', 'Please select yes or no', 'Please enter security conditions details']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease select yes or no', 'Error:\nPlease enter details']

    when: 'I click no but fail to add details'
    transferNo.click()
    submitButton.click()

    then: 'I stay on the page with an additional textarea validation error'
    errorSummaries*.text() == ['Please enter behaviour details', 'Please enter steps details', 'Please enter transfer details', 'Please enter security conditions details']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details']
  }
}
