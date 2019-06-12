package uk.gov.justice.digital.hmpps.cattool.specs.ratings

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
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.ViolencePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class ViolenceSpecification extends GebReportingSpec {

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

  def "The violence page saves details correctly"() {
    when: 'I go to the violence page'

    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)

    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    selectFirstPrisoner()
    at TasklistPage


    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    to ViolencePage, '12'

    then: 'The violence page is displayed'
    at ViolencePage
    info.text() contains 'This person has not been reported as the perpetrator in any assaults in custody before.'
    !warning.displayed
    !highRiskOfViolenceText.displayed
    !seriousThreatText.displayed

    when: 'Details are entered, saved and accessed'
    highRiskOfViolenceYes.click()
    highRiskOfViolenceText << "Some risk text"
    seriousThreatYes.click()
    seriousThreatText << "Some threat text"
    submitButton.click()
    at TasklistPage
    to ViolencePage, '12'

    then: "data is correctly retrieved"
    form.highRiskOfViolence == "Yes"
    form.highRiskOfViolenceText == "Some risk text"
    form.seriousThreat == "Yes"
    form.seriousThreatText == "Some threat text"
    db.getData(12).status == ["STARTED"]
  }

  def "The violence page shows warning correctly"() {
    when: 'I go to the violence page'

    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)

    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    selectFirstPrisoner()
    at TasklistPage

    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, true)
    to ViolencePage, '12'

    then: 'The violence page is displayed with a warning'
    at ViolencePage
    warning.text() contains 'This person has been reported as the perpetrator in 5 assaults in custody before, including 2 serious assaults in the last 12 months'
    !info.displayed

    when: 'The risk profiler returns the safer custody lead flag'
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    to ViolencePage, '12'

    then: 'The violence page is displayed with the safer custody lead message'
    at ViolencePage
    waitFor {
      warning.text() contains 'Please notify your safer custody lead about this prisoner'
      !info.displayed
    }
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    to ViolencePage, '12'
    submitButton.click()

    then: 'I stay on the page with radio button validation errors'
    at ViolencePage
    errorSummaries*.text() == ['High risk of violence: please select yes or no',
                               'Serious Threat: Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no',
                       'Error:\nPlease select yes or no']

    when: 'I click yes but fail to add details'
    highRiskOfViolenceYes.click()
    seriousThreatYes.click()
    submitButton.click()

    then: 'I stay on the page with textarea validation errors'
    errorSummaries*.text() == ['Please enter high risk of violence details',
                               'Please enter serious threat details']
    errors*.text() == ['Error:\nPlease enter details',
                       'Error:\nPlease enter details']
  }
}
