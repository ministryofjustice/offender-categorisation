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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorConfirmBackPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorReviewOutcomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorReviewPage

import java.time.LocalDate
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class SupervisorSpecification extends GebReportingSpec {

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

  def cleanup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()


  def "The supervisor review page can be confirmed"() {
    when: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]]))

    navigateToReview()

    then: 'the change links are not displayed'
    changeLinks.size() == 0

    when: 'the supervisor selects yes'
    elite2api.stubSupervisorApprove()

    appropriateYes.click()
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def response = db.getData(12).form_response
    response[0].toString() contains '"supervisor": {"review": {"proposedCategory": "C", "supervisorCategoryAppropriate": "Yes", "supervisorOverriddenCategoryText": ""}}, "categoriser": {"provisionalCategory": {"suggestedCategory": "C", "categoryAppropriate": "Yes"}}}'
    db.getData(12).status == ["APPROVED"]
  }

  def "The supervisor review page can be confirmed - youth offender"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "I", categoryAppropriate: "Yes"]]]))

    navigateToReview(true, false)

    when: 'the supervisor selects no'
    elite2api.stubSupervisorApprove()
    appropriateNo.click()

    then: 'The page shows info Changing to Cat'
    warning.text().contains 'the provisional category is I'
    newCatMessage.text() == 'Changing to Cat J'

    when: 'Changing to Cat J'
    elite2api.stubCategorise()
    overriddenCategoryText << "Some Text"
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def dbData = db.getData(12).form_response
    dbData[0].toString() contains '"supervisor": {"review": {"proposedCategory": "I", "supervisorOverriddenCategory": "J", "supervisorCategoryAppropriate": "No", "supervisorOverriddenCategoryText": "Some Text"}}, "categoriser": {"provisionalCategory": {"suggestedCategory": "I", "categoryAppropriate": "Yes"}}}'
    db.getData(12).status == ["APPROVED"]
  }

  def "The supervisor review page can be confirmed - indeterminate sentence"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]]))

    navigateToReview(false, true)

    when: 'the supervisor selects no'
    elite2api.stubSupervisorApprove()
    appropriateNo.click()

    then: 'The page shows info Changing to Cat'
    warning.text().contains 'the provisional category is C'
    newCatMessage.text() == 'Changing to Cat B'

    when: 'Changing to Cat B'
    elite2api.stubCategorise()
    overriddenCategoryText << "Some Text"
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def dbData = db.getData(12).form_response
    dbData[0].toString() contains '"supervisor": {"review": {"proposedCategory": "C", "supervisorOverriddenCategory": "B", "supervisorCategoryAppropriate": "No", "supervisorOverriddenCategoryText": "Some Text"}}, "categoriser": {"provisionalCategory": {"suggestedCategory": "C", "categoryAppropriate": "Yes"}}}'
    db.getData(12).status == ["APPROVED"]

    when: 'the supervisor clicks finish'
    finishButton.click()

    then: 'they return to the home page'
    at SupervisorHomePage
  }

  def "The supervisor can send the case back to the categoriser"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]]))

    navigateToReview(false, false)

    when: 'the supervisor clicks the review page "send back to categoriser" button'
    elite2api.stubSupervisorApprove()
    backToCategoriserButton.click()

    then: 'The confirm page is displayed'
    at SupervisorConfirmBackPage

    when: 'no is selected'
    answerNo.click()
    submitButton.click()

    then: 'The review page is re-displayed'
    at SupervisorReviewPage

    when: 'the supervisor confirms to return to categoriser'
    backToCategoriserButton.click()
    at SupervisorConfirmBackPage
    answerYes.click()
    elite2api.stubSentenceData(['B2345XY'], [11], ['28/01/2019'])

    submitButton.click()

    then: 'the supervisor home page is displayed'
    at SupervisorHomePage

    then: 'offender with booking id 12 has been removed'
    names == ['Pitstop, Penelope']

    db.getData(12).status == ["SUPERVISOR_BACK"]
  }

  def "The supervisor review page can be confirmed - youth offender and indeterminate sentence"() {
    when: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "I", categoryAppropriate: "Yes"]]]))

    navigateToReview(true, true)

    then: 'the supervisor sees an info message'
    elite2api.stubSupervisorApprove()
    indeterminateMessage.text() == 'Prisoner has an indeterminate sentence - Cat J not available'

    when: 'Approving'
    elite2api.stubCategorise()
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def dbData = db.getData(12).form_response
    dbData[0].toString() contains '"supervisor": {"review": {"proposedCategory": "I", "supervisorCategoryAppropriate": "Yes"}}, "categoriser": {"provisionalCategory": {"suggestedCategory": "I", "categoryAppropriate": "Yes"}}}'
    db.getData(12).status == ["APPROVED"]
  }

  def "The supervisor review page validates input, suggested category C overridden with D"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    navigateToReview()

    when: 'the supervisor submits without selecting yes or no'
    submitButton.click()

    then: 'the review page is displayed with an error'
    at SupervisorReviewPage

    errorSummaries*.text() == ['Please select yes or no']

    and: 'the supervisor selects no and submits'
    appropriateNo.click()
    submitButton.click()

    then: 'the review page is displayed with errors - enter a category and a reason'
    at SupervisorReviewPage

    //overriddenCategoryB.displayed
    //overriddenCategoryC.displayed
    //!overriddenCategoryD.displayed

    errorSummaries*.text() == ['Please enter the new category', 'Please enter the reason why you changed the category']

    and: 'the supervisor selects a category and submits'
    appropriateNo.click()
    overriddenCategoryB.click()
    submitButton.click()

    then: 'the review page is displayed with an error - reason not provided'
    at SupervisorReviewPage

    errorSummaries*.text() == ['Please enter the reason why you changed the category']

    and: 'the supervisor selects a category, reason and submits'
    elite2api.stubSupervisorApprove()
    appropriateNo.click()
    overriddenCategoryB.click()
    overriddenCategoryText << 'A good reason'
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def response = db.getData(12).form_response
    response[0].toString() contains '"supervisor": {"review": {"proposedCategory": "D", "supervisorOverriddenCategory": "B", "supervisorCategoryAppropriate": "No", "supervisorOverriddenCategoryText": "A good reason"}}'
    db.getData(12).status == ["APPROVED"]
  }

  def navigateToReview(youngOffender = false, indeterminateSentence = false){

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    // 14 days after sentenceStartDate
    elite2api.stubUncategorisedForSupervisor()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)

    at SupervisorHomePage

    elite2api.stubGetOffenderDetails(12, 'B2345YZ', youngOffender, indeterminateSentence)
    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', true)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)

    startButtons[0].click()

    at SupervisorReviewPage
  }

  def "The done page for a supervisor is present"() {
    when: 'I go to the home page as supervisor and select the done tab'

    db.createDataWithStatus(-2, 12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    db.createDataWithStatus(-1,11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)

    elite2api.stubUncategorisedForSupervisor()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage

    elite2api.stubCategorised()

    doneTabLink.click()

    then: 'The supervisor done page is displayed'

    at SupervisorDonePage

    prisonNos == ['B2345XY', 'B2345YZ']
    names == ['Scramble, Tim', 'Hemmel, Sarah']
    approvalDates == ['21/02/2019', '20/02/2019']
    categorisers == ['Lamb, John', 'Fan, Jane']
    approvers == ['Helly, James', 'Helly, James']
    outcomes == ['C', 'C']

  }

}
