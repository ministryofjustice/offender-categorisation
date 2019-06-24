package uk.gov.justice.digital.hmpps.cattool.specs.recat

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
import uk.gov.justice.digital.hmpps.cattool.pages.ApprovedViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserAwaitingApprovalViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSubmittedPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorReviewOutcomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.*
import uk.gov.justice.digital.hmpps.cattool.pages.recat.DecisionPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ReviewRecatPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class OpenConditionsSpecification extends GebReportingSpec {

  def setup() {
    db.clearDb()
  }

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The happy path is correct for categoriser overriding to D, all yeses, then cancelling open conditions"() {
    given:
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([recat: TestFixture.defaultRecat]), 'RECAT')

    when: 'The categoriser sets cat D'
    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage

    elite2Api.stubGetOffenderDetails(12)
    decisionButton.click()
    at DecisionPage
    categoryDOption.click()
    elite2Api.stubCategorise('D')
    submitButton.click()

    then: 'the tasklist recat page is displayed with open conditions section added'
    at TasklistRecatPage
    openConditionsButton.displayed

    when: 'open conditions task is selected'
    openConditionsButton.click()

    then: 'the Earliest Release page is displayed'
    at EarliestReleasePage

    when: 'I submit the page'
    threeOrMoreYearsYes.click()
    justifyYes.click()
    justifyText << 'details text'
    submitButton.click()
///////////////////////////////////////////////////////////////////////////////
    then: 'the Foreign National page is displayed'
    at ForeignNationalPage

    when: 'I submit page'
    isForeignNationalYes.click()
    formCompletedYes.click()
    dueDeportedYes.click()
    exhaustedAppealNo.click()
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk of Serious Harm page is displayed'
    at RiskOfHarmPage

    when: 'I submit page'
    seriousHarmYes.click()
    harmManagedYes.click()
    harmManagedText << 'harmManagedText details'
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
//    then: 'the Further Charges page is displayed'
//    at FurtherChargesPage
//
//    when: 'I submit the page'
//    furtherChargesText << ',furtherChargesText details'
//    increasedRiskYes.click()
//    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk Levels page is displayed'
    at RiskLevelsPage

    when: 'I submit page'
    likelyToAbscondYes.click()
    likelyToAbscondText << 'likelyToAbscondText details'
    submitButton.click()
////////////////////////////////////////////////////////////////////////////

    then: 'I am diverted to the not recommended page'
    at NotRecommendedPage
    reasons*.text() == [//'They have further charges which pose an increased risk in open conditions',
                        'They are likely to abscond or otherwise abuse the lower security of open conditions']

    when: 'No is selected, and submit button is clicked'
    //elite2Api.stubUncategorised()
//    def date11 = LocalDate.now().plusDays(-4).toString()
//    def date12 = LocalDate.now().plusDays(-1).toString()
//    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
//    elite2Api.stubGetOffenderDetails(12)
//    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    stillReferNo.click()
    submitButton.click()

    then: 'tasklist page is displayed without the open conditions section and the cat data is cleared'
    at TasklistRecatPage
    !openConditionsButton.isDisplayed()
    def response2 = new JsonSlurper().parseText(db.getData(12).form_response[0].toString())
    response2.recat.decision == null
    response2.openConditionsRequested == false

    when: 'a new cat entered and the tasklistRecat continue button is clicked'
    decisionButton.click()
    at DecisionPage
    categoryCOption.click()
    elite2Api.stubCategorise('C')
    submitButton.click()
    at TasklistRecatPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, false)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly. Data is persisted - regardless of the decision to end the open conditions flow'
    at ReviewRecatPage
    changeLinks.size() == 5

    securityInputSummary*.text() == ['', 'No', 'No']
    riskAssessmentSummary*.text() == ['', 'lower security category text', 'higher security category text', 'Yes\nother relevant information']
    assessmentSummary*.text() == ['', 'Category C']
    nextReviewDateSummary*.text() == ['', 'Saturday 14th December 2019']

    !earliestReleaseDate.displayed

    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.recat == TestFixture.defaultRecat
    response.supervisor == null
    response.openConditions == [
      earliestReleaseDate: [justify: 'Yes', justifyText: 'details text', threeOrMoreYears: 'Yes'],
      foreignNational    : [dueDeported: 'Yes', formCompleted: 'Yes', exhaustedAppeal: 'No', isForeignNational: 'Yes'],
      riskOfHarm         : [harmManaged: 'Yes', seriousHarm: 'Yes', harmManagedText: 'harmManagedText details'],
      riskLevels         : [likelyToAbscond: 'Yes', likelyToAbscondText: 'likelyToAbscondText details'],
      notRecommended     : [stillRefer: 'No']
    ]
    response.openConditionsRequested == false
  }

  def "The happy path is correct for categoriser overriding to D, all nos"() {
    when: 'The categoriser overrides to D'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([recat: TestFixture.defaultRecat]), 'RECAT')

    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    categoryDOption.click()
    elite2Api.stubCategorise('D')
    submitButton.click()

    then: 'the tasklist page is displayed with open conditions section added'
    at TasklistRecatPage

    when: 'open conditions forms are completed'
    completeOpenConditionsWorkflow(false)

    then: 'tasklist page is displayed with the open conditions section'
    at TasklistRecatPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, false)
    elite2Api.stubAgencyDetails('LPI')
    openConditionsButton.isDisplayed()
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly'
    at ReviewRecatPage

    earliestReleaseDate*.text() == ['', 'No', 'Not applicable']
    foreignNational*.text() == ['', 'No', 'Not applicable', 'Not applicable', 'Not applicable']
    riskOfHarm*.text() == ['', 'No', 'Not applicable']
    riskLevel*.text() == ['', 'No']
    assessmentSummary*.text() == ['', 'Category D']

    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.recat == [
      decision      : [category: "D"],
      securityInput : [securityInputNeeded: "No"],
      nextReviewDate: [date: "14/12/2019"],
      riskAssessment: [
        lowerCategory    : "lower security category text",
        otherRelevant    : "Yes",
        higherCategory   : "higher security category text",
        otherRelevantText: "other relevant information"
      ]
    ]
    response.supervisor == null
    response.openConditions == uk.gov.justice.digital.hmpps.cattool.specs.OpenConditionsSpecification.allNoAnswers
    response.openConditionsRequested

    when: 'I confirm the cat D category'
    elite2Api.stubCategorise('D')
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    return // TODO: rest of test needs updated supervisor functionality

    when: 'The record is viewed by the recategoriser'
    data = db.getData(12)
    response = new JsonSlurper().parseText(data.form_response[0].toString())

    to RecategoriserHomePage
    startButtons[0].click()

    then: 'The correct category is retrieved and data is correct'
    at CategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is D'

    data.status == ["AWAITING_APPROVAL"]
    response.recat == TestFixture.defaultRecat
    response.supervisor == null
    response.openConditions == uk.gov.justice.digital.hmpps.cattool.specs.OpenConditionsSpecification.allNoAnswers
    response.openConditionsRequested

    when: 'the supervisor reviews and accepts the cat D'
    fixture.logout()
    elite2Api.stubUncategorisedForSupervisor()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[0].click()
    at SupervisorReviewPage
    elite2Api.stubSupervisorApprove('D')
    appropriateYes.click()
    submitButton.click()
    data = db.getData(12)
    response = new JsonSlurper().parseText(data.form_response[0].toString())

    then: 'Data is stored correctly'
    at SupervisorReviewOutcomePage
    data.status == ["APPROVED"]
    response.recat == TestFixture.defaultRecat
    response.supervisor == [review: [proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes']]
    response.openConditions == uk.gov.justice.digital.hmpps.cattool.specs.OpenConditionsSpecification.allNoAnswers
    response.openConditionsRequested

    when: 'the approved view page is shown'
    finishButton.click()
    at SupervisorHomePage
    elite2Api.stubCategorised([12])
    doneTabLink.click()
    at SupervisorDonePage
    viewButtons[0].click()

    then: 'details are correct'
    at ApprovedViewPage
    categories*.text() == ['D\nWarning\nCategory D', 'B\nD\nWarning\nThe recommended category was changed from a B to a D', 'D\nWarning\nThe supervisor also recommends category D']
    comments*.text() == ['categoriser override to D comment']
    otherInformationSummary.text() == 'categoriser relevant info 1'
    commentLabel.size() == 1
  }

  def "categoriser overriding to D, supervisor overrides to C"() {
    when: 'The categoriser overrides to D'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([recat: TestFixture.defaultRecat]), 'RECAT')

    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    categoryDOption.click()
    elite2Api.stubCategorise('D')
    //riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    submitButton.click()

    then: 'the tasklist page is displayed with open conditions section added'
    at TasklistRecatPage

    when: 'open conditions forms are completed'
    completeOpenConditionsWorkflow(false)

    then: 'tasklist page is displayed with the open conditions section'
    at TasklistRecatPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false, false)
    elite2Api.stubAgencyDetails('LPI')
    openConditionsButton.isDisplayed()
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly'
    at ReviewRecatPage

    when: 'I confirm the cat D category'
    elite2Api.stubCategorise('D')
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    return // TODO: rest of test needs supervisor work

    when: 'the supervisor reviews and overrides to cat C'
    fixture.logout()
    elite2Api.stubUncategorisedForSupervisor()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[0].click()
    at SupervisorReviewPage
    elite2Api.stubSupervisorApprove('C')
    appropriateNo.click()
    overriddenCategoryC.click()
    overriddenCategoryText << 'super changed D to C'
    otherInformationText << 'super other info'
    submitButton.click()
    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())

    then: 'Data is stored correctly'
    at SupervisorReviewOutcomePage
    data.status == ["APPROVED"]
    response.recat == [
      decision      : [category: "D"],
      securityInput : [securityInputNeeded: "No"],
      nextReviewDate: [date: "14/12/2019"],
      riskAssessment: [
        lowerCategory    : "lower security category text",
        otherRelevant    : "Yes",
        higherCategory   : "higher security category text",
        otherRelevantText: "other relevant information"
      ]
    ]
    response.supervisor == [review: [proposedCategory             : 'D', otherInformationText: 'super other info', supervisorOverriddenCategory: 'C',
                                     supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'super changed D to C']]
    response.openConditions == uk.gov.justice.digital.hmpps.cattool.specs.OpenConditionsSpecification.allNoAnswersWithFurtherCharges
    response.openConditionsRequested // TODO is this ok?

    when: 'the approved view page is shown'
    finishButton.click()
    at SupervisorHomePage
    elite2Api.stubCategorised([12])
    doneTabLink.click()
    at SupervisorDonePage
    viewButtons[0].click()

    then: 'details are correct'
    at ApprovedViewPage
    categories*.text() == ['C\nWarning\nCategory C',
                           'B\nD\nWarning\nThe recommended category was changed from a B to a D',
                           'D\nC\nWarning\nThe recommended category was changed from a D to a C']
    comments*.text() == ['categoriser override to D comment', 'super changed D to C', 'super other info']
    otherInformationSummary.text() == 'categoriser relevant info 1'
    commentLabel.size() == 2
  }

  def "The happy path is correct for supervisor overriding to D"() {
    when: 'The categoriser submits cat C'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([recat: TestFixture.defaultRecat]), 'RECAT')

    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    elite2Api.stubCategorise('C')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false, false)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()
    at ReviewRecatPage
    submitButton.click()

    then: 'the cat C is submitted'
    at CategoriserSubmittedPage

    return // TODO : test needs supervisor work

    when: 'the supervisor overrides to cat D'
    fixture.logout()
    elite2Api.stubUncategorisedForSupervisor()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false, false)
    elite2Api.stubAgencyDetails('LPI')
    startButtons[1].click() // B2345YZ / 12
    at SupervisorReviewPage
    elite2Api.stubSupervisorApprove('D')
    appropriateNo.click()
    overriddenCategoryD.click()
    overriddenCategoryText << "super overriding C to D"
    otherInformationText << "super other info 1"
    submitButton.click()

    then: 'supervisor is returned to home'
    at SupervisorHomePage

    when: 'open conditions forms are completed by categoriser'
    fixture.logout()
    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    completeOpenConditionsWorkflow(false)

    then: 'tasklist page is displayed with the open conditions section'
    at TasklistRecatPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false, false)
    openConditionsButton.isDisplayed()
    continueButton.click()

    then: 'the review page is displayed'
    at ReviewRecatPage

    warning.text() contains 'Based on the information provided, the provisional category is D'

    when: 'I confirm the cat D category'
    elite2Api.stubCategorise('D')
    appropriateYes.click()
    submitButton.click() // *************************

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    when: 'The record is viewed by the categoriser'
    to CategoriserHomePage
    startButtons[0].click()

    then: 'The correct category is retrieved'
    at CategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is D'

    when: 'the supervisor reviews and accepts the cat D'
    fixture.logout()
    elite2Api.stubUncategorisedForSupervisor()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[0].click()
    at SupervisorReviewPage
    elite2Api.stubSupervisorApprove('D')
    appropriateYes.click()
    submitButton.click()
    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())

    then: 'Data is stored correctly'
    at SupervisorReviewOutcomePage
    data.status == ["APPROVED"]
    response.recat == TestFixture.defaultRecat
    response.categoriser == [review             : [:],
                             provisionalCategory: [suggestedCategory: 'D', categoryAppropriate: 'Yes', otherInformationText: 'categoriser relevant info for accept']]
    response.supervisor == [review: [proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes', otherInformationText: 'super other info 1', previousOverrideCategoryText: 'super overriding C to D',]]
    response.openConditions == uk.gov.justice.digital.hmpps.cattool.specs.OpenConditionsSpecification.allNoAnswers
    response.openConditionsRequested

    when: 'the approved view page is shown'
    finishButton.click()
    at SupervisorHomePage
    elite2Api.stubCategorised([12])
    doneTabLink.click()
    at SupervisorDonePage
    viewButtons[0].click()

    then: 'details are correct'
    at ApprovedViewPage
    categories*.text() == ['D\nWarning\nCategory D', 'D\nWarning\nThe categoriser recommends category D', 'D\nWarning\nThe supervisor also recommends category D']
    comments*.text() == ['super overriding C to D', 'super other info 1']
    otherInformationSummary.text() == 'categoriser relevant info for accept'
    commentLabel.size() == 1
  }

  def completeOpenConditionsWorkflow(boolean furtherChargesExist) {
    openConditionsButton.click()
    at EarliestReleasePage
    threeOrMoreYearsNo.click()
    submitButton.click()
    at ForeignNationalPage
    isForeignNationalNo.click()
    submitButton.click()
    at RiskOfHarmPage
    seriousHarmNo.click()
    submitButton.click()
    if (furtherChargesExist) {
      at FurtherChargesPage
      furtherChargesText << ',furtherChargesText details'
      increasedRiskNo.click()
      submitButton.click()
    }
    at RiskLevelsPage
    likelyToAbscondNo.click()
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    submitButton.click()
  }
}
