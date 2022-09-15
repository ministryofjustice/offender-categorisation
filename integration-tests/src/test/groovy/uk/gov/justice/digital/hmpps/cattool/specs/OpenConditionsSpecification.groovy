package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.*

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class OpenConditionsSpecification extends AbstractSpecification {

  static final allNoAnswersWithFurtherCharges = [
    earliestReleaseDate: [threeOrMoreYears: 'No'],
    foreignNational    : [isForeignNational: 'No'],
    riskOfHarm         : [seriousHarm: 'No'],
    furtherCharges     : [furtherCharges: 'Yes', increasedRisk: 'No', furtherChargesText: 'some charges,furtherChargesText details'],
    riskLevels         : [likelyToAbscond: 'No'],
  ]

  static final allNoAnswers = [
    earliestReleaseDate: [threeOrMoreYears: 'No'],
    foreignNational    : [isForeignNational: 'No'],
    riskOfHarm         : [seriousHarm: 'No'],
    riskLevels         : [likelyToAbscond: 'No'],
  ]

  def "The happy path is correct for categoriser overriding to D, all yeses, then cancelling open conditions"() {
    given:
    db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', JsonOutput.toJson([ratings: TestFixture.defaultRatingsB]), 'INITIAL')

    when: 'The categoriser overrides to D'

    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    appropriateNo.click()
    overriddenCategoryD.click()
    overriddenCategoryText << 'categoriser override to D comment'
    otherInformationText << 'categoriser relevant info 1'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'the tasklist page is displayed with open conditions section added'
    at(new TasklistPage(bookingId: '12'))

    when: 'open conditions task is selected'
    waitFor {
      openConditionsButton.click()
    }

    then: 'the Earliest Release page is displayed'
    at EarliestReleasePage

    when: 'I submit a blank page'
    waitFor(5) {
      submitButton.click()
    }

    then: 'there is a validation error'
    waitFor(10) {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit the page with just threeOrMoreYears=Yes'
    threeOrMoreYearsYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit the page with just threeOrMoreYears=Yes and justify=Yes'
    justifyYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter details']
      errors*.text() == ['Error:\nPlease enter details']
    }

    when: 'the Earliest Release page is completed'
    justifyText << 'details text'
    submitButton.click()
///////////////////////////////////////////////////////////////////////////////
    then: 'the Foreign National page is displayed'
    at ForeignNationalPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after isForeignNationalYes'
    isForeignNationalYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after formCompletedYes'
    formCompletedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after dueDeportedYes'
    dueDeportedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'the Foreign National page is completed'
    exhaustedAppealNo.click()
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk of Serious Harm page is displayed'
    at RiskOfHarmPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after seriousHarmYes'
    seriousHarmYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no', 'Please enter details']
      errors*.text() == ['Error:\nPlease select yes or no', 'Error:\nPlease enter details']
    }

    when: 'I submit page after harmManagedYes'
    harmManagedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter details']
      errors*.text() == ['Error:\nPlease enter details']
    }

    when: 'the Risk of Serious Harm page is completed'
    harmManagedText << 'harmManagedText details'

    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Further Charges page is displayed'
    at FurtherChargesPage

    when: 'I submit a blank page'
    form.furtherChargesText = '' // remove existing text
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter details', 'Please select yes or no']
      errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease select yes or no']
    }

    when: 'the Further Charges page is completed'
    furtherChargesText << ',furtherChargesText details'
    increasedRiskYes.click()

    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk Levels page is displayed'
    at RiskLevelsPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after likelyToAbscondYes'
    likelyToAbscondYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter details']
      errors*.text() == ['Error:\nPlease enter details']
    }

    when: 'the Risk Levels page is completed'
    likelyToAbscondText << 'likelyToAbscondText details'
    submitButton.click()
////////////////////////////////////////////////////////////////////////////


    then: 'I am diverted to the not recommended page'
    at NotRecommendedPage
    reasons*.text() == ['They have further charges which pose an increased risk in open conditions',
                        'They are likely to abscond or otherwise abuse the lower security of open conditions']

    when: 'No is selected and continue button is clicked'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    stillReferNo.click()
    submitButton.click()

    then: 'tasklist page is displayed without the open conditions section'
    at TasklistPage
    !openConditionsButton.isDisplayed()


    when: 'the continue button is clicked'
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)
    riskProfilerApi.stubGetLifeProfile('B2345YZ', 'C')
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly. Data is persisted and displayed - regardless of the decision to end the open conditions flow'
    at ReviewPage
    changeLinks.size() == 10

    offendingHistorySummary*.text() == ['Cat A (2012)', 'Libel (21/02/2019)\nSlander (22/02/2019 - 24/02/2019)\nUndated offence', 'Yes\nsome convictions']
    furtherChargesSummary*.text() == ['Yes\nsome charges', '']
    violenceRatingSummary*.text() == ['5', '2', 'No', 'Yes']
    escapeRatingSummary*.text() == ['Yes', 'Yes', 'Yes\nevidence details', 'Yes\ncat b details']
    extremismRatingSummary*.text() == ['Yes', 'Yes']
    securityInputSummary*.text() == ['No', 'No', 'No']
    nextReviewDateSummary*.text() == ['Saturday 14 December 2019']

    riskOfHarm*.text() == ['', 'Yes', 'Yes\nharmManagedText details']

    def data = db.getData(12)
    data.status == ["SECURITY_BACK"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.categoriser == [:] // data cleared
    response.supervisor == null
    response.openConditions == [
      earliestReleaseDate: [justify: 'Yes', justifyText: 'details text', threeOrMoreYears: 'Yes'],
      foreignNational    : [dueDeported: 'Yes', formCompleted: 'Yes', exhaustedAppeal: 'No', isForeignNational: 'Yes'],
      riskOfHarm         : [harmManaged: 'Yes', seriousHarm: 'Yes', harmManagedText: 'harmManagedText details'],
      furtherCharges     : [furtherCharges: 'Yes', increasedRisk: 'Yes', furtherChargesText: 'some charges,furtherChargesText details'],
      riskLevels         : [likelyToAbscond: 'Yes', likelyToAbscondText: 'likelyToAbscondText details'],
      notRecommended     : [stillRefer: 'No']
    ]
    response.openConditionsRequested == false
  }

  def "The happy path is correct for categoriser overriding to D, all nos"() {
    when: 'The categoriser overrides to D'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([ratings: TestFixture.defaultRatingsB]), 'INITIAL')

    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    appropriateNo.click()
    overriddenCategoryD.click()
    assert !indeterminateWarning.displayed
    overriddenCategoryText << 'categoriser override to D comment'
    otherInformationText << 'categoriser relevant info 1'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'the tasklist page is displayed with open conditions section added'
    at(new TasklistPage(bookingId: '12'))

    when: 'open conditions forms are completed'
    completeOpenConditionsWorkflow(true)

    then: 'tasklist page is displayed with the open conditions section'
    at TasklistPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)
    riskProfilerApi.stubGetLifeProfile('B2345YZ', 'C')
    openConditionsButton.isDisplayed()
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly'
    at ReviewPage

    offendingHistorySummary*.text() == ['Cat A (2012)', 'Libel (21/02/2019)\nSlander (22/02/2019 - 24/02/2019)\nUndated offence', 'Yes\nsome convictions']
    furtherChargesSummary*.text() == ['Yes\nsome charges', '']
    violenceRatingSummary*.text() == ['5', '2', 'No', 'Yes']
    escapeRatingSummary*.text() == ['Yes', 'Yes', 'Yes\nevidence details', 'Yes\ncat b details']
    extremismRatingSummary*.text() == ['Yes', 'Yes']
    securityInputSummary*.text() == ['No', 'No', 'No']

    earliestReleaseDate*.text() == ['', 'No', 'Not applicable']
    foreignNational*.text() == ['', 'No', 'Not applicable', 'Not applicable', 'Not applicable']
    riskOfHarm*.text() == ['', 'No', 'Not applicable']
    furtherCharges*.text() == ['', 'some charges,furtherChargesText details', 'No']
    riskLevel*.text() == ['', 'No']

    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.categoriser == [provisionalCategory: [suggestedCategory   : 'B', overriddenCategory: 'D', categoryAppropriate: 'No',
                                                   otherInformationText: 'categoriser relevant info 1', overriddenCategoryText: 'categoriser override to D comment']]
    response.supervisor == null
    response.openConditions == allNoAnswersWithFurtherCharges
    response.openConditionsRequested

    when: 'I continue to the provision category page'
    submitButton.click()

    then: 'I am at the provision category page'
    at new ProvisionalCategoryOpenPage(bookingId: '12')
    warning.text() contains 'Based on the information provided, the provisional category is D'
    !indeterminateWarning.displayed

    when: 'I confirm the cat D category'
    elite2Api.stubCategorise('D', '2019-12-14', 12, 5)
    appropriateYes.click()
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    when: 'The record is viewed by the categoriser'
    data = db.getData(12)
    data.status == ["AWAITING_APPROVAL"]
    data.assessed_by == ["CATEGORISER_USER"]
    data.approved_by == [null]
    data.assessment_date != null
    response = new JsonSlurper().parseText(data.form_response[0].toString())

    elite2Api.stubUncategorisedAwaitingApproval()
    to CategoriserHomePage
    startButtons[1].click()

    then: 'The correct category is retrieved, data is correct and open conditions section is displayed'
    at CategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is D'
    earliestReleaseDate*.text() == ['', 'No', 'Not applicable']

    data.status == ["AWAITING_APPROVAL"]
    data.nomis_sequence_no == [5]
    response.ratings == TestFixture.defaultRatingsB
    response.categoriser == [review             : [:],
                             provisionalCategory: [suggestedCategory   : 'B', overriddenCategory: 'D', categoryAppropriate: 'No',
                                                   otherInformationText: 'categoriser relevant info 1', overriddenCategoryText: 'categoriser override to D comment']]
    response.supervisor == null
    response.openConditions == allNoAnswersWithFurtherCharges
    response.openConditionsRequested

    when: 'the supervisor reviews and accepts the cat D'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[1].click()
    at SupervisorReviewPage
    elite2Api.stubSupervisorApprove('D')
    appropriateYes.click()
    submitButton.click()
    data = db.getData(12)
    response = new JsonSlurper().parseText(data.form_response[0].toString())

    then: 'Data is stored correctly'
    at SupervisorReviewOutcomePage
    data.status == ["APPROVED"]
    response.ratings == TestFixture.defaultRatingsB
    response.categoriser == [review             : [:],
                             provisionalCategory: [suggestedCategory   : 'B', overriddenCategory: 'D', categoryAppropriate: 'No',
                                                   otherInformationText: 'categoriser relevant info 1', overriddenCategoryText: 'categoriser override to D comment']]
    response.supervisor == [review: [proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes']]
    response.openConditions == allNoAnswersWithFurtherCharges
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
    at ApprovedViewPage
    categories*.text() == ['D\nWarning\nCategory D', 'B\nD\nWarning\nThe recommended category was changed from a B to a D', 'D\nWarning\nThe supervisor also recommends category D']
    comments*.text() == ['categoriser override to D comment']
    otherInformationSummary.text() == 'categoriser relevant info 1'
    commentLabel.size() == 1
  }

  def "categoriser overriding to D, supervisor overrides to C"() {
    when: 'The categoriser overrides to D'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([ratings: TestFixture.defaultRatingsB]), 'INITIAL')

    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    appropriateNo.click()
    overriddenCategoryD.click()
    overriddenCategoryText << 'categoriser override to D comment'
    otherInformationText << 'categoriser relevant info 1'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'the tasklist page is displayed with open conditions section added'
    at(new TasklistPage(bookingId: '12'))

    when: 'open conditions forms are completed'
    completeOpenConditionsWorkflow(true)

    then: 'tasklist page is displayed with the open conditions section'
    at TasklistPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)
    riskProfilerApi.stubGetLifeProfile('B2345YZ', 'C')

    openConditionsButton.isDisplayed()
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly'
    at ReviewPage

    when: 'I continue to the provision category page'
    submitButton.click()

    then: 'I am at the provision category page'
    at new ProvisionalCategoryOpenPage(bookingId: '12')
    warning.text() contains 'Based on the information provided, the provisional category is D'

    when: 'I confirm the cat D category'
    elite2Api.stubCategorise('D', '2019-12-14', 12, 5)
    appropriateYes.click()
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    when: 'the supervisor reviews and overrides to cat C'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[1].click()
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
    response.ratings == TestFixture.defaultRatingsB
    response.categoriser == [review             : [:],
                             provisionalCategory: [suggestedCategory   : 'B', overriddenCategory: 'D', categoryAppropriate: 'No',
                                                   otherInformationText: 'categoriser relevant info 1', overriddenCategoryText: 'categoriser override to D comment']]
    response.supervisor == [review: [proposedCategory             : 'D', otherInformationText: 'super other info', supervisorOverriddenCategory: 'C',
                                     supervisorCategoryAppropriate: 'No', supervisorOverriddenCategoryText: 'super changed D to C']]


    response.openConditions == allNoAnswersWithFurtherCharges
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
    at ApprovedViewPage
    categories*.text() == ['C\nWarning\nCategory C',
                           'B\nD\nWarning\nThe recommended category was changed from a B to a D',
                           'D\nC\nWarning\nThe recommended category was changed from a D to a C']
    comments*.text() == ['categoriser override to D comment', 'super changed D to C', 'super other info']
    otherInformationSummary.text() == 'categoriser relevant info 1'
    commentLabel.size() == 2
  }

  def "The happy path is correct for supervisor overriding to D"() {
    when: 'The categoriser accepts a cat C'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([ratings: TestFixture.defaultRatingsC]), 'INITIAL')

    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    appropriateYes.click()
    otherInformationText << 'categoriser relevant info for accept'
    elite2Api.stubCategorise('C', '2019-12-14', 12, 5)
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()

    then: 'the cat C is submitted'
    at CategoriserSubmittedPage

    when: 'the supervisor overrides to cat D'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[1].click() // B2345YZ / 12
    at SupervisorReviewPage
    elite2Api.stubSupervisorReject('12', 5, LocalDate.now().toString())
    elite2Api.stubSentenceData(['B2345XY'], [11], [LocalDate.of(2019, 1, 28).toString()])
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

    elite2Api.stubUncategorised()
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    startButtons[0].click()
    at TasklistPage
    supervisorMessageButton.click()

    then: 'the supervisor message is available'
    at SupervisorMessagePage
    messageValues*.text() == ['Test User', 'super overriding C to D reason text']

    when: 'open conditions forms are completed'
    submitButton.click()
    at TasklistPage
    completeOpenConditionsWorkflow(false)

    then: 'tasklist page is displayed with the open conditions section'
    at TasklistPage
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false, false)
    riskProfilerApi.stubGetLifeProfile('B2345YZ', 'C')
    openConditionsButton.isDisplayed()
    continueButton.click()

    then: 'the review page is displayed'
    at ReviewPage

    when: 'I continue to the provisional category page'
    submitButton.click()

    then: 'I am at the provision category page for open conditions'
    at new ProvisionalCategoryOpenPage(bookingId: '12')
    warning.text() contains 'Based on the information provided, the provisional category is D'

    when: 'I confirm the cat D category'
    elite2Api.stubCategoriseUpdate('D', '2019-12-14', 12, 5)
    appropriateYes.click()
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage

    when: 'The record is viewed by the categoriser'
    elite2Api.stubUncategorisedAwaitingApproval()
    to CategoriserHomePage
    startButtons[1].click()

    then: 'The correct category is retrieved'
    at CategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is D'

    when: 'the supervisor reviews and accepts the cat D'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    startButtons[1].click()
    at SupervisorReviewPage
    elite2Api.stubSupervisorApprove('D')
    appropriateYes.click()
    submitButton.click()
    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())

    then: 'Data is stored correctly'
    at SupervisorReviewOutcomePage
    data.status == ["APPROVED"]
    response.ratings == TestFixture.defaultRatingsC
    response.categoriser == [review             : [:],
                             provisionalCategory: [suggestedCategory: 'D', categoryAppropriate: 'Yes', otherInformationText: 'categoriser relevant info for accept']]
    response.supervisor == [review     : [proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes', otherInformationText: 'super other info 1', previousOverrideCategoryText: 'super overriding C to D reason text',],
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
    at ApprovedViewPage
    categories*.text() == ['D\nWarning\nCategory D', 'D\nWarning\nThe categoriser recommends category D', 'D\nWarning\nThe supervisor also recommends category D']
    comments*.text() == ['super overriding C to D reason text', 'super other info 1']
    otherInformationSummary.text() == 'categoriser relevant info for accept'
    commentLabel.size() == 1
  }

  private completeOpenConditionsWorkflow(boolean furtherChargesExist) {
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
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()
  }
}
