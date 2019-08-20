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
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RiskAssessmentPage

class RiskAssessmentSpecification extends GebReportingSpec {

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

  def "The page saves details correctly"() {
    when: 'I go to the Higher Security Review page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    riskAssessmentButton.click()

    then: 'The page is displayed'
    at RiskAssessmentPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Details are entered, saved and accessed'
    lowerCategory << 'lower text'
    higherCategory << 'higher text'
    otherRelevantYes.click()
    otherRelevantText << 'extra info'
    submitButton.click()
    at TasklistRecatPage
    riskAssessmentButton.click()
    at RiskAssessmentPage

    then: "data is correctly retrieved"
    lowerCategory == 'lower text'
    higherCategory == 'higher text'
    form.otherRelevant == "Yes"
    otherRelevantText == 'extra info'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type.value == ['RECAT']
    response.recat == [riskAssessment: [lowerCategory: 'lower text', higherCategory: 'higher text', otherRelevant: 'Yes', otherRelevantText: 'extra info']]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    riskAssessmentButton.click()

    at RiskAssessmentPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at RiskAssessmentPage
    errorSummaries*.text() == ['Please enter lower security category details', 'Please enter higher security category details', 'Please select yes or no']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease select yes or no']

    when: 'I click yes but fail to add details'
    otherRelevantYes.click()
    submitButton.click()

    then: 'I stay on the page with an additional textarea validation error'
    errorSummaries*.text() == ['Please enter lower security category details', 'Please enter higher security category details', 'Please enter other relevant information']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details']
  }
}
