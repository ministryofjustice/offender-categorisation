package uk.gov.justice.digital.hmpps.cattool.specs.ratings

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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSecurityBackPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSecurityInputPage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityReviewPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class SecurityInputSpecification extends GebReportingSpec {

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


  def "The initial cat security page can be edited"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)

    securityButton.click()

    at(new CategoriserSecurityInputPage(bookingId: '12'))
    securityRadio = 'No'
    saveButton.click()

    at(new TasklistPage(bookingId: '12'))

    when: 'The edit link is selected'

    securityButton.click()

    then: 'the security input page is displayed with the saved form details'

    at(new CategoriserSecurityInputPage(bookingId: '12'))

    securityRadio == 'No'
  }

  def "A prisoner can be manually referred to security"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    securityButton.click()
    at(new CategoriserSecurityInputPage(bookingId: '12'))
    securityRadio = 'Yes'
    securityText << 'Some text'
    saveButton.click()
    at(new TasklistPage(bookingId: '12'))
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Manually referred to Security ($today)")

    when: 'a security user views their homepage'
    elite2Api.stubGetCategoriserStaffDetailsByUsernameList(CATEGORISER_USER)
    fixture.logout()
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    elite2Api.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    fixture.loginAs(SECURITY_USER)

    then: 'this prisoner is present'
    at SecurityHomePage
    prisonNos[0] == 'B2345YZ'
    referredBy[0] == 'Api User'

    when: 'the security user enters data'
    startButtons[0].click()
    at new SecurityReviewPage(bookingId: '12')
    categoriserText == 'Some text'
    securityText << 'security info'
    saveButton.click()

    then: 'the prisoner status is back from security'
    at SecurityHomePage
    prisonNos.size() == 0
    noOffendersText == 'There are no referrals to review.'

    when: 'the categoriser revisits the page and enters a category decision'
    fixture.logout()

    elite2Api.stubUncategorised()
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    selectFirstPrisoner() // has been sorted to top of list!

    at new TasklistPage(bookingId: '12')
    $('#securitySection').text().contains("Completed Security ($today)")
    securityButton.click()
    at new CategoriserSecurityBackPage(bookingId: '12')
    warning.text() contains 'This person was referred to the security team'
    noteFromSecurity.text() == 'security info'
    catBRadio = 'No'
    saveButton.click()

    then: 'the security rating section is complete and database is correct'
    at new TasklistPage(bookingId: '12')
    securityButton.text() == 'Edit'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ["SECURITY_BACK"]
    fixture.sameDate(LocalDate.now(), data.start_date)
    data.referred_by == ["CATEGORISER_USER"]
    fixture.sameDate(LocalDate.now(), data.referred_date)
    data.security_reviewed_by == ["SECURITY_USER"]
    fixture.sameDate(LocalDate.now(), data.security_reviewed_date)
    data.cat_type.value == ["INITIAL"]
    response.ratings == [securityBack: [catB: "No"], securityInput: [securityInputNeeded: "Yes", securityInputNeededText: "Some text"]]
    response.security.review == [securityReview: "security info"]

    when: 'the categoriser reviews the security page'
    securityButton.click()
    at new CategoriserSecurityBackPage(bookingId: '12')

    then: 'the category decision is shown'
    catBRadio == 'No'
  }
}
