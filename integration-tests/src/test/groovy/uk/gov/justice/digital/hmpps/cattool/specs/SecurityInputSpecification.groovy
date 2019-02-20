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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSecurityInputPage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class SecurityInputSpecification extends GebReportingSpec {

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

  def "The security page displays an alert when status is transferred to security"() {
    when: 'I go to the tasklist page'

    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', true,)

    securityButton.click()

    then: 'The security input page is displayed with an alert'
    at new CategoriserSecurityInputPage(bookingId: '12')
    warningTextDiv.text().contains('This offender was referred to security')

    when: 'I return to the tasklist page'
    backLink.click()
    at new CategoriserTasklistPage(bookingId: '12')

    then: 'the prisoner start button is locked'
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/YYYY')
    $('#securitySection').text().contains("Automatically referred to Security ($today)")
  }

  def "The security page can be edited"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)

    securityButton.click()

    at(new CategoriserSecurityInputPage(bookingId: '12'))
    securityRadio = 'No'
    saveButton.click()

    at(new CategoriserTasklistPage(bookingId: '12'))

    when: 'The edit link is selected'

    securityEditLink.click()

    then: 'the security input page is displayed with the saved form details'

    at(new CategoriserSecurityInputPage(bookingId: '12'))

    securityRadio == 'No'
  }

  def "A prisoner can be manually referred to security"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))
    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    securityButton.click()
    at(new CategoriserSecurityInputPage(bookingId: '12'))
    securityRadio = 'Yes'
    securityText << 'Some text'
    saveButton.click()
    at(new CategoriserTasklistPage(bookingId: '12'))
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('DD/MM/YYYY')
    $('#securitySection').text().contains("Manually referred to Security ($today)")

    when: 'I view the categoriser list again'
    elite2api.stubGetUserDetails(CATEGORISER_USER, 'LEI')
    to CategoriserHomePage

    then: 'the prisoner start button is locked'
    startButtons[0].tag() == 'button'
    startButtons[0].@disabled
    statuses[0] == 'Manually referred to Security'

    when: 'a security user views the homepage'
    logout()
    elite2api.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    fixture.loginAs(SECURITY_USER)

    then: 'this prisoner is present'
    at SecurityHomePage
    prisonNos[0] == 'B2345YZ'
    referredBy[0] == 'Api User'
  }
}
