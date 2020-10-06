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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoryHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.PrisonerBackgroundPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RiskAssessmentPage

class PrisonerBackgroundSpecification extends GebReportingSpec {

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

  def "The page displays all warnings and saves details correctly"() {
    when: 'I go to the Prisoner background page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubAgencyDetails('LPI')
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, true)

    prisonerBackgroundButton.click()

    then: 'The page is displayed'
    at PrisonerBackgroundPage
    headerValue*.text() == fixture.MINI_HEADER
    alertInfo*.text() == [
      'E-List: First xel comment 2016-09-14',
      '''E-List: Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text 2016-09-15 (expired) (inactive)''',
      'Escape Risk Alert: First xer comment 2016-09-16']
    extremismWarning.text() contains 'This person is at risk of engaging in, or vulnerable to, extremism'
    violenceWarning.text() contains 'This person has been reported as the perpetrator in 5 assaults in custody before, including 2 serious assaults and 3 non-serious assaults in the past 12 months.'
    !violenceNotifyWarning.displayed
    escapeWarning.text().contains('This person is considered an escape risk')
    !escapeInfo.displayed
    !extremismInfo.displayed
    !escapeInfo.displayed


    when: 'Details are entered, saved and accessed'
    offenceDetails << 'offenceDetails text'
    submitButton.click()
    at TasklistRecatPage
    prisonerBackgroundButton.click()
    at PrisonerBackgroundPage

    then: "data is correctly retrieved"
    offenceDetails == 'offenceDetails text'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type.value == ['RECAT']
    response.recat == [prisonerBackground: [offenceDetails: 'offenceDetails text']]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def 'The page validates correctly'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubAgencyDetails('LPI')
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, true)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)

    prisonerBackgroundButton.click()

    at PrisonerBackgroundPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at PrisonerBackgroundPage
    errorSummaries*.text() == ['Please enter details']
    errors*.text() == ['Error:\nPlease enter details']
  }

  def "The prisoner background page provides a link to view Offender category history"() {
    when: 'I go to the Prisoner background page and click on the category history link'

    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubAgencyDetails('LPI')
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, true)

    prisonerBackgroundButton.click()
    at PrisonerBackgroundPage

    then: 'Cat history is displayed in a new tab'
    withNewWindow({ historyLink.click() }) {
      at CategoryHistoryPage
    }
  }


}
