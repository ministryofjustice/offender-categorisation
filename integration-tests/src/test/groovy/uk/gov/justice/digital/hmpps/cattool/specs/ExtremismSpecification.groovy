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
import uk.gov.justice.digital.hmpps.cattool.pages.ExtremismPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class ExtremismSpecification extends GebReportingSpec {

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

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The extremism page saves details correctly"() {
    when: 'I go to the extremism page'

    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)

    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    selectFirstPrisoner()

    at CategoriserTasklistPage

    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)
    to ExtremismPage, '12'

    then: 'The extremism page is displayed'
    at ExtremismPage
    warningMessage.text() contains 'This person is at risk of engaging in or vulnerable to extremism'
    !info.displayed
    !previousTerrorismOffencesText.displayed

    when: 'Details are entered, saved and accessed'
    previousTerrorismOffencesYes.click()
    previousTerrorismOffencesText << "Some risk text"
    submitButton.click()
    at CategoriserTasklistPage
    extremismButton.click()
    at ExtremismPage

    then: "data is correctly retrieved"
    form.previousTerrorismOffences == "Yes"
    form.previousTerrorismOffencesText == "Some risk text"
    db.getData(12).status == ["STARTED"]
  }

  def "The extremism page correctly shows an info message when not increased risk"() {
    when: 'I go to the extremism page'

    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)

    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    selectFirstPrisoner()

    at CategoriserTasklistPage

    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false)
    to ExtremismPage, '12'

    then: 'The extremism page is displayed'
    at ExtremismPage
    info.text() contains 'This person is not at risk of engaging in or vulnerable to extremism.'
    !warningMessage.displayed
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false)
    to ExtremismPage, '12'
    submitButton.click()

    then: 'I stay on the page with radio button validation errors'
    at ExtremismPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I click yes but fail to add details'
    previousTerrorismOffencesYes.click()
    submitButton.click()

    then: 'I stay on the page with textarea validation errors'
    errorSummaries*.text() == ['Please enter the previous offences']
    errors*.text() == ['Error:\nPlease enter details']
  }
}
