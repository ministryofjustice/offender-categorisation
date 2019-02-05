package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSubmittedPage
import uk.gov.justice.digital.hmpps.cattool.pages.ProvisionalCategoryPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.ITAG_USER

class ProvisionalCategorySpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)
  DatabaseUtils db = new DatabaseUtils()

  def setup() {
    db.clearDb()
  }

  def 'The Provisional Category page is present'() {
    when: 'I go to the Provisional Category page'
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], LocalDate.now().plusDays(-3).toString())
    fixture.loginAs(UserAccount.ITAG_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to ProvisionalCategoryPage, '12'

    then: 'The page is displayed correctly'
    at ProvisionalCategoryPage
    !overriddenCategoryB.displayed
    !overriddenCategoryC.displayed
    !overriddenCategoryD.displayed

    when: 'I enter some data, save and return to the page'
    appropriateNo.click()
    overriddenCategoryC.click()
    overriddenCategoryText << "Some Text"
    submitButton.click()
    at CategoriserSubmittedPage
    to ProvisionalCategoryPage, '12'

    then: 'The data is shown on return'
    at ProvisionalCategoryPage
    form.categoryAppropriate == "No"
    form.overriddenCategory == "C"
    form.overriddenCategoryText == "Some Text"
  }

  def 'Validation test'() {
    when: 'I submit the Provisional Category page with an empty text area'
    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], LocalDate.now().plusDays(-3).toString())
    fixture.loginAs(ITAG_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to ProvisionalCategoryPage, '12'
    appropriateNo.click()
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at ProvisionalCategoryPage
    errorSummaries*.text() == ['Please enter the new category',
                               'Please enter the reason why you changed the category']
    errors*.text() == ['Please select the new category',
                       'Please enter the reason why you changed the category']
  }
}
