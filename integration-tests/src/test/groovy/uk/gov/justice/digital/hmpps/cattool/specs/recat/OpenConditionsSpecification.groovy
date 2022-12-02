package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.*
import uk.gov.justice.digital.hmpps.cattool.pages.recat.*
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class OpenConditionsSpecification extends AbstractSpecification {

  static final allNoAnswers = [
    earliestReleaseDate: [threeOrMoreYears: 'No'],
    victimContactScheme: [vcsOptedFor: 'No'],
    foreignNational    : [isForeignNational: 'No'],
    riskOfHarm         : [seriousHarm: 'No'],
    furtherCharges     : [furtherCharges: 'No'],
    riskLevels         : [likelyToAbscond: 'No'],
  ]

  def "The happy path is correct for recategoriser setting cat D, all yeses, then cancelling open conditions"() {
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
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'the tasklist recat page is displayed with open conditions section added'
    at TasklistRecatPage
    openConditionsButton.displayed

    when: 'open conditions task is selected'
    openConditionsButton.click()

    then: 'the Earliest Release page is displayed'
    at EarliestReleasePage

    when: 'I submit the page'
    threeOrMoreYearsYes.displayed
    threeOrMoreYearsYes.click()


    justifyYes.displayed

    justifyYes.click()
    justifyText << 'justify details text'
    submitButton.click()

    then: 'the Victim Contact Scheme page is displayed'
    at VictimContactSchemePage

    when: 'I submit a blank page'
    waitFor(5) {
      submitButton.click()
    }

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Select Yes if any victims of the crime have opted-in to the Victim Contact Scheme']
      errors*.text() == ['Error:\nSelect Yes if any victims of the crime have opted-in to the Victim Contact Scheme']
    }

    when: 'I submit page'
    vcsOptedForYes.click()
    contactedVLOYes.click()
    vloResponseText << 'vlo response text'
    submitButton.click()

    then: 'the Foreign National page is displayed'
    at ForeignNationalPage

    when: 'I submit page'
    isForeignNationalYes.click()
    formCompletedYes.click()
    dueDeportedYes.click()
    exhaustedAppealNo.click()
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk of serious harm page is displayed'
    at RiskOfHarmPage

    when: 'I submit page'
    seriousHarmYes.click()
    harmManagedYes.click()
    harmManagedText << 'harmManagedText details'
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Further Charges page is displayed'
    at FurtherChargesPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'

    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit the page'
    furtherChargesYes.click()
    furtherChargesText << ',furtherChargesText details'
    increasedRiskYes.click()
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk of escaping or absconding page is displayed'
    at RiskLevelsPage

    when: 'I submit page'
    likelyToAbscondYes.click()
    likelyToAbscondText << 'likelyToAbscondText details'
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'I am diverted to the not recommended page'
    at NotRecommendedPage
    reasons*.text() == ['They have further charges which pose an increased risk in open conditions',
                        'They are likely to abscond or otherwise abuse the lower security of open conditions']

    when: 'No is selected, and submit button is clicked'
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

    then: 'the review page is displayed and Data is stored correctly. Data is persisted (and displayed) - regardless of the decision to end the open conditions flow'
    at ReviewRecatPage
    changeLinks.size() == 6

    securityInputSummary*.text() == ['', 'No', 'No', 'No']
    riskAssessmentSummary*.text() == ['', 'lower security category text', 'higher security category text', 'Yes\nother relevant information']
    assessmentSummary*.text() == ['', 'Category C']
    nextReviewDateSummary*.text() == ['', 'Saturday 14 December 2019']

    riskOfHarm*.text() == ['', 'Yes', 'Yes\nharmManagedText details']

    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.recat == TestFixture.defaultRecat
    response.supervisor == null
    response.openConditions == [
      earliestReleaseDate: [justify: 'Yes', justifyText: 'justify details text', threeOrMoreYears: 'Yes'],
      victimContactScheme: [vcsOptedFor: 'Yes', contactedVLO: 'Yes', vloResponseText: 'vlo response text' ],
      foreignNational    : [dueDeported: 'Yes', formCompleted: 'Yes', exhaustedAppeal: 'No', isForeignNational: 'Yes'],
      riskOfHarm         : [harmManaged: 'Yes', seriousHarm: 'Yes', harmManagedText: 'harmManagedText details'],
      furtherCharges     : [furtherCharges: 'Yes', increasedRisk: 'Yes', furtherChargesText: ',furtherChargesText details'],
      riskLevels         : [likelyToAbscond: 'Yes', likelyToAbscondText: 'likelyToAbscondText details'],
      notRecommended     : [stillRefer: 'No']
    ]
    response.openConditionsRequested == false
  }

  def "The happy path is correct for recategoriser setting cat D, all nos"() {
    when: 'The categoriser overrides to D'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([
      recat: TestFixture.defaultRecat
    ]), 'RECAT')

    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    assert !indeterminateWarning.displayed
    categoryDOption.click()
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'the tasklist page is displayed with open conditions section added'
    at TasklistRecatPage

    when: 'open conditions forms are completed'
    completeOpenConditionsWorkflow()

    then: 'tasklist page is displayed with the open conditions section completed'
    at TasklistRecatPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, false)
    elite2Api.stubAgencyDetails('LPI')
    openConditionsButton.isDisplayed()
    openConditionsButton.text() == 'Edit'
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly'
    at ReviewRecatPage

    earliestReleaseDate*.text() == ['', 'No', 'Not applicable']
    victimContactSchemeDl.displayed
    victimContactScheme*.text() == ['','No','Not applicable']
    foreignNational*.text() == ['', 'No', 'Not applicable', 'Not applicable', 'Not applicable']
    riskOfHarm*.text() == ['', 'No', 'Not applicable']
    riskLevel*.text() == ['', 'No']
    assessmentSummary*.text() == ['', 'Category D']

    def data = db.getData(12)
    data.status == ["STARTED"]
    data.assessed_by == [null]
    data.approved_by == [null]
    data.assessment_date == [null]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.recat == [
      decision          : [category: "D"],
      oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
      securityInput     : [securityInputNeeded: "No"],
      nextReviewDate    : [date: "14/12/2019"],
      prisonerBackground: [offenceDetails: "offence Details text"],
      riskAssessment    : [
        lowerCategory    : "lower security category text",
        otherRelevant    : "Yes",
        higherCategory   : "higher security category text",
        otherRelevantText: "other relevant information"
      ]
    ]
    response.supervisor == null
    response.openConditions == allNoAnswers
    response.openConditionsRequested

    when: 'I confirm the cat D category'
    elite2Api.stubCategorise('D', '2019-12-14', 12, 5)
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    when: 'The record is viewed by the recategoriser'

    elite2Api.stubRecategorise(['P', 'A', 'A', 'A'])
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])

    to RecategoriserHomePage
    startButtons[0].click()

    then: 'The correct category is retrieved and data is correct'
    at RecategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is D'
    earliestReleaseDate*.text() == ['', 'No', 'Not applicable']

    def afterSubmitData = db.getData(12)
    afterSubmitData.assessed_by == ["RECATEGORISER_USER"]
    afterSubmitData.approved_by == [null]
    afterSubmitData.assessment_date != null
    afterSubmitData.nomis_sequence_no == [5]
    def afterSubmitResponse = new JsonSlurper().parseText(afterSubmitData.form_response[0].toString())

    afterSubmitData.status == ["AWAITING_APPROVAL"]
    afterSubmitResponse.recat == [
      decision          : [category: "D"],
      oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
      securityInput     : [securityInputNeeded: "No"],
      nextReviewDate    : [date: "14/12/2019"],
      prisonerBackground: [offenceDetails: "offence Details text"],
      riskAssessment    : [
        lowerCategory    : "lower security category text",
        otherRelevant    : "Yes",
        higherCategory   : "higher security category text",
        otherRelevantText: "other relevant information"
      ]
    ]
    afterSubmitResponse.supervisor == null
    afterSubmitResponse.openConditions == allNoAnswers
    afterSubmitResponse.openConditionsRequested

    when: 'the supervisor reviews and accepts the cat D'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceData(['B2345XY'], [11], ['28/01/2019'])
    elite2Api.stubAssessments('dummy')
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[0].click()
    at SupervisorReviewPage
    warning.text() contains 'The categoriser recommends category D'
    elite2Api.stubSupervisorApprove('D')
    appropriateYes.click()
    submitButton.click()
    data = db.getData(12)
    response = new JsonSlurper().parseText(data.form_response[0].toString())

    then: 'Data is stored correctly'
    at SupervisorReviewOutcomePage
    data.status == ["APPROVED"]
    response.recat.decision == [category: "D"]
    response.supervisor == [review: [proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes']]
    response.openConditions == allNoAnswers
    response.openConditionsRequested

    when: 'the approved view page is shown'
    finishButton.click()
    at SupervisorHomePage
    elite2Api.stubCategorised([12])
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()
    at SupervisorDonePage
    elite2Api.stubAgencyDetails('LEI')
    viewButtons[0].click()

    then: 'details are correct'
    at ApprovedViewRecatPage
    categories*.text() == ['D\nWarning\nCategory D',
                           'D\nWarning\nThe categoriser recommends category D',
                           'D\nWarning\nThe supervisor also recommends category D']
    !comments.displayed
    !commentLabel.displayed
  }

  def "recategoriser sets D, supervisor overrides to C"() {
    when: 'The categoriser overrides to D'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([
      recat: TestFixture.defaultRecat
    ]), 'RECAT')

    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    categoryDOption.click()
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'the tasklist page is displayed with open conditions section added'
    at TasklistRecatPage

    when: 'open conditions forms are completed'
    completeOpenConditionsWorkflow()

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
    elite2Api.stubCategorise('D', '2019-12-14', 12, 5)
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    when: 'the supervisor reviews and overrides to cat C'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceData(['B2345XY'], [11], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[0].click()
    at SupervisorReviewPage
    elite2Api.stubSupervisorApprove('C')
    elite2Api.stubAssessments('dummy')
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
      decision          : [category: "D"],
      oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
      securityInput     : [securityInputNeeded: "No"],
      nextReviewDate    : [date: "14/12/2019"],
      prisonerBackground: [offenceDetails: "offence Details text"],
      riskAssessment    : [
        lowerCategory    : "lower security category text",
        otherRelevant    : "Yes",
        higherCategory   : "higher security category text",
        otherRelevantText: "other relevant information"
      ]
    ]
    response.supervisor == [review: [proposedCategory             : 'D', otherInformationText: 'super other info', supervisorOverriddenCategory: 'C',
                                     supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'super changed D to C']]
    response.openConditions == allNoAnswers
    response.openConditionsRequested // TODO is this ok?

    when: 'the approved view page is shown'
    finishButton.click()
    at SupervisorHomePage
    elite2Api.stubCategorised([12])
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()
    at SupervisorDonePage
    elite2Api.stubAgencyDetails('LEI')
    viewButtons[0].click()

    then: 'details are correct'
    at ApprovedViewRecatPage
    categories*.text() == ['C\nWarning\nCategory C',
                           'D\nWarning\nThe categoriser recommends category D',
                           'D\nC\nWarning\nThe recommended category was changed from a D to a C']
    comments*.text() == ['super changed D to C', 'super other info']
    commentLabel.size() == 1
  }

  def "The happy path is correct for supervisor overriding to D"() {
    when: 'The categoriser submits cat C'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([
      recat: TestFixture.defaultRecat
    ]), 'RECAT')

    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false, false)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()
    at ReviewRecatPage
    elite2Api.stubCategorise('C', '2019-12-14', 12, 5)
    submitButton.click()

    then: 'the cat C is submitted'
    at CategoriserSubmittedPage

    when: 'the supervisor overrides to cat D'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY'], [11], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    elite2Api.stubAgencyDetails('LPI')
    startButtons[0].click() // B2345YZ / 12
    at SupervisorReviewPage
    elite2Api.stubSupervisorReject('12', 5, LocalDate.now().toString())
    appropriateNo.click()
    overriddenCategoryD.click()
    assert !indeterminateWarning.displayed
    overriddenCategoryText << "super overriding C to D reason text"
    otherInformationText << "super other info 1"
    submitButton.click()

    then: 'supervisor is returned to home'
    at SupervisorHomePage

    when: 'open conditions forms are accessed by categoriser'
    fixture.logout()
    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    completeOpenConditionsWorkflow()

    then: 'tasklist page is displayed with the open conditions section and decision cleared'
    at TasklistRecatPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    openConditionsButton.isDisplayed()
    decisionButton.text() == 'Start'

    when: 'the categoriser looks at the supervisor message'
    supervisorMessageButton.click()

    then: 'the supervisor message is available'
    at SupervisorMessagePage
    messageValues*.text() == ['Test User', 'super overriding C to D reason text']

    when: 'the recategoriser chooses cat D instead of C'
    submitButton.click()
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    categoryDOption.click()
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()
    at TasklistRecatPage
    continueButton.click()

    then: 'the review page is displayed'
    at ReviewRecatPage

    when: 'I confirm the cat D category'
    elite2Api.stubCategoriseUpdate('D', '2019-12-14', 12, 5)
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    when: 'The record is viewed by the recategoriser'
    elite2Api.stubRecategorise(['P', 'A', 'A', 'A'])
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])

    to RecategoriserHomePage
    startButtons[0].click()

    then: 'The correct category is retrieved'
    at RecategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is D'

    when: 'the supervisor reviews and accepts the cat D'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY'], [11], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[0].click()
    at SupervisorReviewPage
    otherInformationText == 'super other info 1'
    otherInformationText << ' + 2'
    elite2Api.stubSupervisorApprove('D')
    elite2Api.stubAssessments('dummy')
    appropriateYes.click()
    submitButton.click()
    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())

    then: 'Data is stored correctly'
    at SupervisorReviewOutcomePage
    data.status == ["APPROVED"]
    response.recat == [
      decision          : [category: "D"],
      oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
      securityInput     : [securityInputNeeded: "No"],
      nextReviewDate    : [date: "14/12/2019"],
      prisonerBackground: [offenceDetails: "offence Details text"],
      riskAssessment    : [
        lowerCategory    : "lower security category text",
        otherRelevant    : "Yes",
        higherCategory   : "higher security category text",
        otherRelevantText: "other relevant information"
      ]
    ]
    response.categoriser == null
    response.supervisor == [review     : [proposedCategory             : 'D',
                                          supervisorCategoryAppropriate: 'Yes',
                                          otherInformationText         : 'super other info 1 + 2',
                                          previousOverrideCategoryText : 'super overriding C to D reason text'],
                            confirmBack: [isRead: true, messageText: 'super overriding C to D reason text', supervisorName: 'Test User']]
    response.openConditions == allNoAnswers
    response.openConditionsRequested

    when: 'the approved view page is shown'
    finishButton.click()
    at SupervisorHomePage
    elite2Api.stubCategorised([12])
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()
    at SupervisorDonePage
    elite2Api.stubAgencyDetails('LEI')
    viewButtons[0].click()

    then: 'details are correct'
    at ApprovedViewRecatPage
    categories*.text() == ['D\nWarning\nCategory D',
                           'D\nWarning\nThe categoriser recommends category D',
                           'D\nWarning\nThe supervisor also recommends category D']
    comments*.text() == ['super overriding C to D reason text', 'super other info 1 + 2']
    commentLabel.size() == 1
  }

  private completeOpenConditionsWorkflow() {
    openConditionsButton.click()
    at EarliestReleasePage
    threeOrMoreYearsNo.click()
    submitButton.click()
    at VictimContactSchemePage
    vcsOptedForNo.click()
    submitButton.click()
    at ForeignNationalPage
    isForeignNationalNo.click()
    submitButton.click()
    at RiskOfHarmPage
    seriousHarmNo.click()
    submitButton.click()
    at FurtherChargesPage
    furtherChargesNo.click()
    submitButton.click()
    at RiskLevelsPage
    likelyToAbscondNo.click()
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()
  }
}
