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
import uk.gov.justice.digital.hmpps.cattool.pages.recat.DecisionPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.HigherSecurityReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.MiniHigherSecurityReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.NextReviewDatePage

class NextReviewDateSpecification extends GebReportingSpec {

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
    nextReviewDateButton.click()

    then: 'The page is displayed'
    at NextReviewDatePage
    headerValue*.text() == ['Hillmob, Ant', 'B2345YZ', '17/02/1970', 'C']

    when: 'No date is entered - validation kicks in'
    submitButton.click()
    at NextReviewDatePage

    then: "Error is displayed"
    errorSummaries*.text() == ['Enter a valid date that is after today']
    errors*.text() == ['Error:\nEnter a valid date that is after today']


    when: 'Details are entered, saved and accessed'
    reviewDate << "23/01/2056"

    submitButton.click()
    at TasklistRecatPage
    nextReviewDateButton.click()
    at NextReviewDatePage

    then: "data is correctly retrieved"
    form.date == "23/01/2056"

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type.value == ['RECAT']
    response.recat == [nextReviewDate: [date     : "23/01/2056"]]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

}
