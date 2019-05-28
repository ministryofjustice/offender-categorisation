package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorConfirmBackPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorReviewOutcomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorReviewPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class SupervisorSpecification extends GebReportingSpec {

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


  def "The supervisor review page can be confirmed"() {
    when: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]]))

    navigateToReview()

    then: 'the change links are not displayed and the buttons omit the current cat'
    changeLinks.size() == 0
    // the displayed property does not work on these radios for some reason
    overriddenCategoryB.@type == 'radio'
    overriddenCategoryC.@type == null
    overriddenCategoryD.@type == 'radio'


    when: 'the supervisor selects yes (after changing their mind)'
    elite2Api.stubSupervisorApprove("C")

    appropriateNo.click()
    overriddenCategoryB.click()
    overriddenCategoryText << "Im not sure"
    appropriateYes.click()
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor == [review: [proposedCategory: 'C', supervisorCategoryAppropriate: 'Yes']]
    response.categoriser == [provisionalCategory: [suggestedCategory: 'C', categoryAppropriate: 'Yes']]
    response.openConditionsRequested == null
    data.status == ["APPROVED"]
  }

  def "The supervisor review page can be confirmed - youth offender"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "I", categoryAppropriate: "Yes"]]]))

    navigateToReview(true, false)
    !openConditionsHeader.isDisplayed()

    when: 'the supervisor selects no'
    appropriateNo.click()

    then: 'The page shows info Changing to Cat'
    warnings[0].text().contains 'the provisional category is I'
    newCatMessage.text() == 'Changing to Cat J'

    when: 'The supervisor clicks continue'
    overriddenCategoryText << "reason text"
    submitButton.click()

    then: 'The record is sent back to the categoriser'
    at SupervisorHomePage

    def data = db.getData(12)
    data.status == ["SUPERVISOR_BACK"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor == [review: [proposedCategory: 'I', supervisorOverriddenCategory: 'J', supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'reason text']]
    response.categoriser == [provisionalCategory: [suggestedCategory: 'J', categoryAppropriate: 'Yes']]
    response.openConditionsRequested
  }

  def "The supervisor review page displays Open conditions data when category is D or J"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      openConditions: [riskLevels: [likelyToAbscond: "No"], riskOfHarm: [seriousHarm: "No"], foreignNational: [isForeignNational: "No"], earliestReleaseDate: [threeOrMoreYears: "No"]],
      categoriser: [provisionalCategory: [suggestedCategory: "D", categoryAppropriate: "Yes", otherInformationText: "cat info"]]]))

    when: 'The supervisor views the review page for a category D'
    navigateToReview(false, false)

    then: 'the review page includes Open conditions information'
    openConditionsHeader.isDisplayed()

    riskOfHarm*.text() == ['', 'No', 'Not applicable']
    foreignNational*.text() == ['', 'No', 'Not applicable', 'Not applicable', 'Not applicable']
    earliestReleaseDate*.text() == ['', 'No', 'Not applicable']
    riskLevel*.text() == ['', 'No']

    when: 'The supervisor views the review page for a category J'
    db.clearDb()
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      openConditions: [riskLevels: [likelyToAbscond: "No"], riskOfHarm: [seriousHarm: "No"], foreignNational: [isForeignNational: "No"], earliestReleaseDate: [threeOrMoreYears: "No"]],
      categoriser: [provisionalCategory: [suggestedCategory: "J", categoryAppropriate: "Yes", otherInformationText: "cat info"]]]))

    to SupervisorHomePage

    startButtons[0].click()

    at SupervisorReviewPage

    then: 'the review page includes Open conditions information'
    openConditionsHeader.isDisplayed()
  }

  def "The categoriser has overridden - not open conditions"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings    : TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "B", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    when: 'The supervisor views the review page for an overridden category B'
    navigateToReview(false, false)

    then: 'the review page includes changed category and normal answers but not open conditions information'
    !openConditionsHeader.isDisplayed()
    warning.text() == 'C\nB\nWarning\nThe category was originally C and is now B'
    offendingHistorySummary[2].text() == 'some convictions'
  }

  def "The supervisor review page can be confirmed - indeterminate sentence"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]]))

    navigateToReview(false, true)
    !openConditionsHeader.isDisplayed()

    when: 'the supervisor selects no'
    elite2Api.stubSupervisorApprove("B")
    appropriateNo.click()

    then: 'The page shows info Changing to Cat'
    warnings[0].text().contains 'the provisional category is C'
    newCatMessage.text() == 'Changing to Cat B'
    indeterminateMessage.text() == 'Prisoner has indeterminate sentence - Cat D not available'

    when: 'Changing to Cat B'
    elite2Api.stubCategorise('B')
    overriddenCategoryText << "Some Text"
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage
    userHeader.text().contains 'User, Test'


    def data = db.getData(12)
    data.status == ["APPROVED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor ==  [review: [proposedCategory: 'C', supervisorOverriddenCategory: 'B', supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'Some Text']]
    response.categoriser == [provisionalCategory: [suggestedCategory: 'C', categoryAppropriate: 'Yes']]
    response.openConditionsRequested == null

    when: 'the supervisor clicks finish'
    finishButton.click()

    then: 'they return to the home page'
    at SupervisorHomePage
  }

  def "The supervisor can send the case back to the categoriser"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]]))

    navigateToReview(false, false)

    when: 'the supervisor clicks the review page "send back to categoriser" button'
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
    elite2Api.stubSentenceData(['B2345XY'], [11], ['28/01/2019'])

    submitButton.click()

    then: 'the supervisor home page is displayed'
    at SupervisorHomePage

    then: 'offender with booking id 12 has been removed'
    names == ['Pitstop, Penelope']

    db.getData(12).status == ["SUPERVISOR_BACK"]
  }

  def "Overriding to an Open conditions category returns the record to the categoriser"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "B", categoryAppropriate: "Yes"]]]))

    navigateToReview(false, false)

    when: 'Supervisor chooses to override to category D'
    appropriateNo.click()
    overriddenCategoryD.click()

    then: 'A warning is displayed'
    warnings[1].text() contains "Making this category change means that the categoriser will have to provide more information."

    when: 'The continue button is clicked'
    overriddenCategoryText << "should be a D"
    submitButton.click()

    then: 'the record is returned to categoriser with open conditions requested and suggestedCategory forced to D'
    at SupervisorHomePage

    def data = db.getData(12)
    data.status == ["SUPERVISOR_BACK"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor == [review: [proposedCategory: 'B', supervisorOverriddenCategory: 'D', supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'should be a D']]
    response.categoriser == [provisionalCategory: [suggestedCategory: 'D', categoryAppropriate: 'Yes']]
    response.openConditionsRequested
  }

  def "Overriding to an Open conditions category returns the record to the categoriser (youth offender)"() {
    given: 'supervisor is viewing the review page for a youth offender'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "I", categoryAppropriate: "Yes"]]]))

    navigateToReview(false, false)

    when: 'Supervisor chooses to override to category J'
    appropriateNo.click()

    then: 'A warning is displayed'
    warnings[1].text() contains "Making this category change means that the categoriser will have to provide more information."

    when: 'The continue button is clicked'
    overriddenCategoryText << "should be a J"
    submitButton.click()

    then: 'the record is returned to categoriser with open conditions requested and suggestedCategory forced to J'
    at SupervisorHomePage

    def data = db.getData(12)
    data.status == ["SUPERVISOR_BACK"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor == [review: [proposedCategory: 'I', supervisorOverriddenCategory: 'J', supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'should be a J']]
    response.categoriser == [provisionalCategory: [suggestedCategory: 'J', categoryAppropriate: 'Yes']]
    response.openConditionsRequested
  }

  def "The supervisor review page can be confirmed - youth offender and indeterminate sentence"() {
    when: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "I", categoryAppropriate: "Yes"]]]))

    navigateToReview(true, true)

    then: 'the supervisor sees an info message'
    elite2Api.stubSupervisorApprove('I')
    indeterminateMessage.text() == 'Prisoner has an indeterminate sentence - Cat J not available'

    when: 'Approving'
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def data = db.getData(12)
    data.status == ["APPROVED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor ==  [review: [proposedCategory: 'I', supervisorCategoryAppropriate: 'Yes']]
    response.categoriser == [provisionalCategory: [suggestedCategory: 'I', categoryAppropriate: 'Yes']]
    response.openConditionsRequested == null
  }

  def "The supervisor review page validates input, suggested category B overridden with D"() {
    given: 'supervisor is viewing the review page for B2345YZ'
    db.createDataWithStatus(12, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "D", categoryAppropriate: "Yes", otherInformationText: "Some Text"]]]))

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

    // the displayed property does not work on these radios for some reason
    overriddenCategoryB.@type == 'radio'
    overriddenCategoryC.@type == 'radio'
    overriddenCategoryD.@type == null

    errorSummaries*.text() == ['Please enter the new category', 'Please enter the reason why you changed the category']

    and: 'the supervisor selects a category and submits'
    appropriateNo.click()
    overriddenCategoryB.click()
    submitButton.click()

    then: 'the review page is displayed with an error - reason not provided'
    at SupervisorReviewPage

    errorSummaries*.text() == ['Please enter the reason why you changed the category']

    and: 'the supervisor selects a category, reason and submits'
    elite2Api.stubSupervisorApprove('B')
    appropriateNo.click()
    overriddenCategoryB.click()
    overriddenCategoryText << 'A good reason'
    submitButton.click()

    then: 'the review outcome page is displayed and review choices persisted'
    at SupervisorReviewOutcomePage

    def data = db.getData(12)
    data.status == ["APPROVED"]
    data.approval_date != null
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.categoriser == [provisionalCategory: [suggestedCategory: "D", categoryAppropriate: "Yes", otherInformationText: "Some Text"]]
    response.supervisor ==  [review: [proposedCategory: 'D', supervisorOverriddenCategory: 'B', supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'A good reason']]
    response.openConditionsRequested == null
  }

  def navigateToReview(youngOffender = false, indeterminateSentence = false){

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedForSupervisor()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)

    at SupervisorHomePage

    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', youngOffender, indeterminateSentence)
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', true)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)

    startButtons[0].click()

    at SupervisorReviewPage
  }

  def "The done page for a supervisor is present"() {
    when: 'I go to the home page as supervisor and select the done tab'

    db.createDataWithStatus(-2, 12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    db.createDataWithStatus(-1,11, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)

    elite2Api.stubUncategorisedForSupervisor()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage

    elite2Api.stubCategorised()

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
