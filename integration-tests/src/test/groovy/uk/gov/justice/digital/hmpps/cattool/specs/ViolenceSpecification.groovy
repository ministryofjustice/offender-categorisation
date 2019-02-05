package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ViolencePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER

class ViolenceSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  def setup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The violence page saves details correctly"() {
    when: 'I go to the violence page'

    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], LocalDate.now().plusDays(-3).toString())
    fixture.loginAs(ITAG_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to ViolencePage, '12'

    then: 'The violence page is displayed'
    //at(new ViolencePage(bookingId: '12')
    at ViolencePage
    !highRiskOfViolenceText.displayed
    !seriousThreatText.displayed

    when: 'Details are entered, saved and accessed'
    highRiskOfViolenceYes.click()
    highRiskOfViolenceText << "Some risk text"
    seriousThreatYes.click()
    seriousThreatText << "Some threat text"
    submitButton.click()
    at CategoriserTasklistPage
    to ViolencePage, '12'

    then: "data is correctly retrieved"
    form.highRiskOfViolence == "Yes"
    form.highRiskOfViolenceText == "Some risk text"
    form.seriousThreat == "Yes"
    form.seriousThreatText == "Some threat text"
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], LocalDate.now().plusDays(-3).toString())
    fixture.loginAs(ITAG_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to ViolencePage, '12'
    submitButton.click()

    then: 'I stay on the page with radio button validation errors'
    at ViolencePage
    errorSummaries*.text() == ['High risk of violence: please select yes or no',
                               'Serious Threat: Please select yes or no']
    errors*.text() == ['Please select yes or no',
                       'Please select yes or no']

    when: 'I click yes but fail to add details'
    highRiskOfViolenceYes.click()
    seriousThreatYes.click()
    submitButton.click()

    then: 'I stay on the page with textarea validation errors'
    errorSummaries*.text() == ['Please enter high risk of violence details',
                               'Please enter serious threat details']
    errors*.text() == ['Please enter details',
                       'Please enter details']
  }
}
