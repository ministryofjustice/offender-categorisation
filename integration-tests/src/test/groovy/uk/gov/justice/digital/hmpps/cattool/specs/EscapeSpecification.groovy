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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserEscapePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class EscapeSpecification extends GebReportingSpec {

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

  def "The escape page displays an alert when the offender is on the escape list"() {
    when: 'I go to the tasklist page'

    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])

    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    startButtons[0].click()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, false)

    escapeButton.click()

    then: 'The security input page is displayed with an alert'
    at(new CategoriserEscapePage(bookingId: '12'))

    warningTextDiv.text().contains('This person is on the heightened / standard / escort e-list')

  }

  def "The escape page can be edited"() {
    given: 'the security input page has been completed'

    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])

    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    startButtons[0].click()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)

    escapeButton.click()

    at(new CategoriserEscapePage(bookingId: '12'))
    radio = 'No'
    saveButton.click()

    at(new CategoriserTasklistPage(bookingId: '12'))

    when: 'The edit link is selected'

    escapeEditLink.click()

    then: 'the escape page is displayed with the saved form details'

    at(new CategoriserEscapePage(bookingId: '12'))

    radio == 'No'

  }
}
