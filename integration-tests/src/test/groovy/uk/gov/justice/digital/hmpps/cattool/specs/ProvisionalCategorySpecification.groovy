package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSubmittedPage
import uk.gov.justice.digital.hmpps.cattool.pages.ProvisionalCategoryPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class ProvisionalCategorySpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def setup() {
    db.clearDb()
  }

  def 'The Provisional Category page is present'() {
    given: 'Ratings data exists for for B2345YZ'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [furtherCharges: "some convictions"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeCatB: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ]
    ]))

    when: 'I go to the Provisional Category page'
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(UserAccount.CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to ProvisionalCategoryPage, '12'

    then: 'The page is displayed correctly'
    at ProvisionalCategoryPage
    !overriddenCategoryB.displayed
    !overriddenCategoryC.displayed
    !overriddenCategoryD.displayed
    warning.text() contains 'Based on the information provided, the provisional category is B'

    when: 'I enter some data, save and return to the page'
    elite2api.stubCategorise('C')
    appropriateNo.click()
    overriddenCategoryC.click()
    overriddenCategoryText << "Some Text"
    otherInformationText << "other info  Text"
    submitButton.click()
    at CategoriserSubmittedPage
    to ProvisionalCategoryPage, '12'

    then: 'The data is shown on return'
    at ProvisionalCategoryPage
    form.categoryAppropriate == "No"
    form.overriddenCategory == "C"
    form.otherInformationText == "other info  Text"
    form.overriddenCategoryText == "Some Text"

    db.getData(12).status == ["AWAITING_APPROVAL"]
  }

  def 'Validation test'() {
    when: 'I submit the Provisional Category page without selecting anything'
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to ProvisionalCategoryPage, '12'
    submitButton.click()

    then: 'I stay on the page with validation errors'
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I just select appropriate "No"'
    appropriateNo.click()
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at ProvisionalCategoryPage
    errorSummaries*.text() == ['Please enter the new category',
                               'Please enter the reason why you changed the category']
    errors*.text() == ['Error:\nPlease select the new category',
                       'Error:\nPlease enter the reason why you changed the category']

    when: 'I submit the Provisional Category page with an empty text area'
    overriddenCategoryB.click()
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at ProvisionalCategoryPage
    errorSummaries*.text() == ['Please enter the reason why you changed the category']
    errors*.text() == ['Error:\nPlease enter the reason why you changed the category']
  }

  def 'young offender test'() {
    given: 'Ratings data exists for for B2345YZ'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [furtherCharges: "Yes", furtherChargesText: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "I", categoryAppropriate: "Yes"]]]))

    when: 'I go to the Provisional Category page for young offender'
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(UserAccount.CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12, 'B2345YZ', true)
    to ProvisionalCategoryPage, '12'
    at ProvisionalCategoryPage
    !newCatMessage.displayed
    appropriateNo.click()

    then: 'The page shows info Changing to Cat J'
    warning.text().contains 'the provisional category is I'
    newCatMessage.text() == 'Changing to Cat J'

    when: 'Changing to Cat J'
    elite2api.stubCategorise('J')
    overriddenCategoryText << "Some Text"
    submitButton.click()

    then: 'Cat J details are saved'
    def response = db.getData(12).form_response
    response[0].toString() contains '"categoriser": {"provisionalCategory": {"suggestedCategory": "I", "overriddenCategory": "J", "categoryAppropriate": "No", "otherInformationText": "", "overriddenCategoryText": "Some Text"}}'
  }

  def 'indefinite sentence test'() {
    when: 'I go to the Provisional Category page'
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(UserAccount.CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12, 'B2345YZ', false, true)
    to ProvisionalCategoryPage, '12'

    then: 'The page is displayed correctly'
    at ProvisionalCategoryPage
    appropriateNo.click()

    then: 'The page shows cat B and C'
    warning.text().contains 'the provisional category is C'
    newCatMessage.text() == 'Changing to Cat B'
  }

  def 'indefinite sentence test for young offender'() {
    when: 'I go to the Provisional Category page'
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(UserAccount.CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12, 'B2345YZ', true, true)
    to ProvisionalCategoryPage, '12'

    then: 'The page is displayed correctly'
    at ProvisionalCategoryPage
    !appropriateNo.displayed
    indeterminateMessage.text() == 'Prisoner has an indeterminate sentence - Cat J not available'
  }
}
