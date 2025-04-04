package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.ProvisionalCategoryOpenPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class ProvisionalCategorySpecification extends AbstractSpecification {

  public static final TRICKY_TEXT = '!"£$%^&*()_+-={}[]:@~;\'#<>?,./|\\'

  def 'The Provisional Category page is present'() {
    given: 'Ratings data exists for B2345YZ'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB
    ]))
    db. createRiskProfileDataForExistingRow(12, JsonOutput.toJson([
      lifeProfile: [nomsId: 'B2345YZ', riskType: 'LIFE', provisionalCategorisation: 'C']
    ]))

    when: 'I go to the Provisional Category page'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'

    then: 'The page is displayed correctly'
    warning[0].text() == 'B\nWarning\nBased on the information provided, the provisional category is Category B'

    when: 'I enter some data, save and return to the page'
    elite2Api.stubCategorise('C', '2019-12-14')
    appropriateNo.click()

    // the displayed property does not work on these radios for some reason
    overriddenCategoryB.@type == null
    overriddenCategoryC.@type == 'radio'
    overriddenCategoryD.@type == 'radio'

    overriddenCategoryC.click()
    overriddenCategoryText << "over ridden category text"
    otherInformationText << "other info  Text"
    submitButton.click()
    at CategoriserSubmittedPage
    to new ProvisionalCategoryPage(bookingId: '12'), '12'

    then: 'The data is correct and is shown on return'
    form.categoryAppropriate == "No"
    form.overriddenCategory == "C"
    form.otherInformationText == "other info  Text"
    form.overriddenCategoryText == "over ridden category text"

    def data = db.getData(12)
    data.status == ["AWAITING_APPROVAL"]
    data.assessed_by == ["CATEGORISER_USER"]
    data.approved_by == [null]
    data.assessment_date != null
    data.nomis_sequence_no == [4]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor == null
    response.categoriser == [provisionalCategory: [suggestedCategory  : 'B', overriddenCategory: 'C',
                                                   categoryAppropriate: 'No', otherInformationText: 'other info  Text', overriddenCategoryText: 'over ridden category text']]
    response.openConditionsRequested == null
  }

  def 'Life sentence triggers provisional category B'() {
    given: 'B2345YZ has a life sentence'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings    : TestFixture.defaultRatingsC,
    ]))
    db. createRiskProfileDataForExistingRow(12, JsonOutput.toJson([
      lifeProfile: [nomsId: 'B2345YZ', riskType: 'LIFE', provisionalCategorisation: 'B']
    ]))

    when: 'I go to the Provisional Category page'
    elite2Api.stubUncategorised()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().plusDays(-3).toString(), LocalDate.now().plusDays(-1).toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'

    then: 'The provisional category is B'
    warning[0].text() == 'B\nWarning\nBased on the information provided, the provisional category is Category B'
  }

  def 'Validation test'() {
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([ratings: TestFixture.defaultRatingsC]))

    when: 'I submit the Provisional Category page without selecting anything'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    submitButton.click()

    then: 'I stay on the page with validation errors'
    waitFor {
      errorSummaries*.text() == ['Select yes if you think this category is appropriate']
      errors.text().toString().equals("Error:\nSelect yes if you think this category is appropriate")
    }

    when: 'I just select appropriate "No"'
    appropriateNo.click()
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at new ProvisionalCategoryPage(bookingId: '12')
    errorSummaries*.text() == ['Please enter the new category',
                               'Enter the reason why you changed the category']
    errors*.text() == ['Error:\nPlease enter the new category', 'Error:\nEnter the reason why you changed the category']

    when: 'I submit the Provisional Category page with an empty text area'
    overriddenCategoryB.click()
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at new ProvisionalCategoryPage(bookingId: '12')
    errorSummaries*.text() == ['Enter the reason why you changed the category']
    errors.text().toString() == "Error:\nEnter the reason why you changed the category"
  }

  def 'young offender redirects to open conditions flow'() {
    given: 'Ratings data exists for B2345YZ'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings    : TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "I", categoryAppropriate: "Yes"]]]))

    when: 'I go to the Provisional Category page for young offender'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', true)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    appropriateNo.click()

    then: 'The page shows info Changing to Cat J'
    warning.text().contains 'the provisional category is YOI closed'
    newCatMessage.text() == 'Changing to YOI Open'

    when: 'Changing to Cat J'
    overriddenCategoryText << "over ridden category text"
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'user is redirected to the categoriser tasklist with the open conditions flow available'
    at TasklistPage

    def data = db.getData(12)
    data.status == ["STARTED"]
    data.nomis_sequence_no == [null]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor == null
    response.categoriser == [provisionalCategory: [suggestedCategory  : 'I', overriddenCategory: 'J',
                                                   categoryAppropriate: 'No', overriddenCategoryText: 'over ridden category text']]
    response.openConditionsRequested
  }

  def 'Category D redirects to open conditions flow'() {
    given: 'Ratings data exists for B2345YZ'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings    : TestFixture.defaultRatingsB,
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]]))

    when: 'I go to the Provisional Category page for the offender'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    !newCatMessage.displayed
    appropriateNo.click()
    overriddenCategoryText << "over ridden category text"
    otherInformationText << TRICKY_TEXT
    overriddenCategoryD.click()
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()

    then: 'user is redirected to open conditions flow'
    at TasklistPage
    openConditionsButton.displayed

    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsB
    response.supervisor == null
    response.categoriser == [provisionalCategory: [suggestedCategory  : 'B', overriddenCategory: 'D',
                                                   categoryAppropriate: 'No', otherInformationText: TRICKY_TEXT, overriddenCategoryText: 'over ridden category text']]
    response.openConditionsRequested
  }

  def 'indeterminate sentence test'() {
    given: 'Ratings data exists'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]))

    when: 'I go to the Provisional Category page'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, true)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'
    appropriateNo.click()

    then: 'The page is displayed correctly'
    !indeterminateWarning.displayed
    warning[0].text() == 'C\nWarning\nBased on the information provided, the provisional category is Category C'
    overriddenCategoryD.click()
    indeterminateWarning.displayed
  }

  def 'Rollback on elite2Api failure'() {
    given: 'I am at the Provisional Category page'
    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsB
    ]))
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    to new ProvisionalCategoryPage(bookingId: '12'), '12'

    when: 'I save some data, but an api error occurs'
    elite2Api.stubCategoriseError()
    appropriateYes.click()
    submitButton.click()

    then: 'An error is displayed and the data is not persisted'
    at ErrorPage
    errorSummaryTitle.text() == 'Server Error'

    def data = db.getData(12)
    data.status == ["STARTED"]
    !data.form_response.value[0].contains("provisionalCategory")
  }

  def 'Confirmation of Cat D'() {
    given: 'Prisoner has completed the open conditions pages'

    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings                : TestFixture.defaultRatingsC,
      categoriser            : [provisionalCategory: [suggestedCategory  : 'B', overriddenCategory: 'D',
                                                      categoryAppropriate: 'No', otherInformationText: TRICKY_TEXT, overriddenCategoryText: 'over ridden category text']],
      openConditionsRequested: true,
      openConditions         : TestFixture.defaultOpenConditions,
    ]))

    when: 'I go to the Provisional Category page'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    via ProvisionalCategoryPage, '12'

    then: 'The page redirects to the open conditions version and shows cat D'
    at new ProvisionalCategoryOpenPage(bookingId: '12')
    warning[0].text() == '!\nWarning\nThe provisional category is open category'

    when: 'I confirm Cat D'
    elite2Api.stubCategorise('D', '2019-12-14')
    appropriateYes.click()

    submitButton.click()
    at CategoriserSubmittedPage
    via ProvisionalCategoryPage, '12'

    then: 'The data is correct and is shown on return'
    at new ProvisionalCategoryOpenPage(bookingId: '12')
    // blank   form.categoryAppropriate == ""

    def data = db.getData(12)
    data.status == ["AWAITING_APPROVAL"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsC
    response.supervisor == null
    response.categoriser == [provisionalCategory: [suggestedCategory  : 'B', overriddenCategory: 'D',
                                                   categoryAppropriate: 'No', otherInformationText: TRICKY_TEXT, overriddenCategoryText: 'over ridden category text']]
    response.openConditionsRequested
    response.openConditions == TestFixture.defaultOpenConditions
  }

  def 'Confirmation of Cat D rejected'() {
    given: 'Prisoner has completed the open conditions pages'

    db.createDataWithStatus(12, 'STARTED', JsonOutput.toJson([
      ratings                : TestFixture.defaultRatingsC,
      categoriser            : [provisionalCategory: [suggestedCategory  : 'B', overriddenCategory: 'D',
                                                      categoryAppropriate: 'No', otherInformationText: TRICKY_TEXT, overriddenCategoryText: 'over ridden category text']],
      openConditionsRequested: true,
      openConditions         : TestFixture.defaultOpenConditions,
    ]))

    when: 'I go to the Provisional Category page'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    via ProvisionalCategoryPage, '12'

    then: 'The page redirects to the open conditions version and shows cat D'
    at new ProvisionalCategoryOpenPage(bookingId: '12')
    warning[0].text() == '!\nWarning\nThe provisional category is open category'

    when: 'I reject Cat D'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    appropriateNo.click()
    submitButton.click()

    then: 'The tasklist is shown with open conditions task removed but form data retained in database'
    at TasklistPage
    assert openConditionsButton.displayed == false


    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.ratings == TestFixture.defaultRatingsC
    response.supervisor == null
    response.categoriser == [:]
    response.openConditionsRequested == false
    response.openConditions == null
  }
}
