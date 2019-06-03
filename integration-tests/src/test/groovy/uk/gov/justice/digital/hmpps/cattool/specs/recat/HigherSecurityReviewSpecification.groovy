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

  def "The page saves details correctly"() {
    when: 'I go to the Higher Security Review page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    higherSecurityReviewButton.click()

    then: 'The page is displayed'
    at HigherSecurityReviewPage
    headerValue*.text() == ['Hillmob, Ant', 'B2345YZ', '17/02/1970']

    when: 'Details are entered, saved and accessed'
    behaviour << "Some behaviour text"
    steps << "Some steps text"
    transferYes.click()
    transferText << "Some transfer text"
    conditions << "Some conditions text"

    submitButton.click()
    at TasklistRecatPage
    higherSecurityReviewButton.click()
    at HigherSecurityReviewPage

    then: "data is correctly retrieved"
    behaviour == "Some behaviour text"
    steps == "Some steps text"
    form.transfer == "Yes"
    transferText == "Some transfer text"
    conditions == "Some conditions text"
    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    def risk = new JsonSlurper().parseText(data.risk_profile[0].toString())
    data.status == ['STARTED']
    data.cat_type.value == ['RECAT']
    response.recat == [higherSecurityReview: [steps     : "Some steps text", transfer: "Yes", behaviour: "Some behaviour text",
                                              conditions: "Some conditions text", transferText: "Some transfer text"]]
    risk.socProfile == [nomsId: "B2345YZ", riskType: "SOC", transferToSecurity: false, provisionalCategorisation: "C"]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    higherSecurityReviewButton.click()
    at HigherSecurityReviewPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at HigherSecurityReviewPage
    errorSummaries*.text() == ['Please enter behaviour details', 'Please enter steps details', 'Please select yes or no', 'Please enter security conditions details']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease select yes or no', 'Error:\nPlease enter details']

    when: 'I click yes but fail to add details'
    transferYes.click()
    submitButton.click()

    then: 'I stay on the page with an additional textarea validation error'
    errorSummaries*.text() == ['Please enter behaviour details', 'Please enter steps details', 'Please enter transfer details', 'Please enter security conditions details']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details']
  }
}
