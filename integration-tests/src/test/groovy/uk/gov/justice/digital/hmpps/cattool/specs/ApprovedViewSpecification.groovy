package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.ApprovedViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ApprovedViewRecatPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class ApprovedViewSpecification extends AbstractSpecification {

   def "The approved view page is correctly displayed (suggested Cat)"() {

    when: 'the approved view page for B2345YZ is selected'
    db.doCreateCompleteRow(-1, 12, JsonOutput.toJson([
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]],
      supervisor : [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null, 1, null, 'LEI',
      'dummy', 'current_timestamp(2)', null, null, null, null, null, 'SUPERVISOR_USER')
    navigateToView()

    then: 'the cat details are correct'
    headerValue*.text() == fixture.FULL_HEADER
    categories*.text() == ['C\nWarning\nCategory C',
                           'C\nWarning\nThe categoriser recommends category C',
                           'C\nWarning\nThe supervisor also recommends category C']
    !comments.displayed
    comments.size() == 0
    !openConditionsHeader.isDisplayed()
    // NOTE reviewContents.html is tested by ReviewSpecification
  }

  def "The approved view page is correctly displayed (Cat overridden by categoriser and supervisor)"() {

    when: 'the approved view page for B2345YZ is selected'
    db.doCreateCompleteRow(-1, 12, JsonOutput.toJson([
      categoriser   : [provisionalCategory: [suggestedCategory     : "B", categoryAppropriate: "No", overriddenCategory: "C",
                                             overriddenCategoryText: "Here are the categoriser's comments on why the category was changed"]],
      supervisor    : [review: [supervisorCategoryAppropriate   : "No", supervisorOverriddenCategory: "D",
                                supervisorOverriddenCategoryText: "Here are the supervisor's comments on why the category was changed"]],
      openConditions: [riskLevels: [likelyToAbscond: "No"], riskOfHarm: [seriousHarm: "No"], foreignNational: [isForeignNational: "No"], earliestReleaseDate: [threeOrMoreYears: "No"]]
    ]), 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null, 1, null, 'LEI',
      'dummy', 'current_timestamp(2)', null, null, null, null, null, 'SUPERVISOR_USER')
    navigateToView()


    then: 'the cat details are correct'
    categories*.text() == ['D\nWarning\nCategory D',
                           'B\nC\nWarning\nThe recommended category was changed from a B to a C',
                           'C\nD\nWarning\nThe recommended category was changed from a C to a D']
    comments*.text() == ['Here are the categoriser\'s comments on why the category was changed',
                         'Here are the supervisor\'s comments on why the category was changed']

    openConditionsHeader.isDisplayed()

    when: "I click on the button"
    submitButton.click()

    then: "I return to the supervisor done page"
    at SupervisorDonePage
  }

  def "An old cat can be displayed"() {
    def threeMonthsAgoPlusOneDay = LocalDate.now().minusMonths(3).plusDays(1).format('yyyy-MM-dd')
    def threeMonthsAgo = LocalDate.now().minusMonths(3).format('yyyy-MM-dd')

    when: 'the approved view page for B2345YZ is selected'
    db.doCreateCompleteRow(-1, 12, JsonOutput.toJson([
      recat: [decision: [category: "B", categoryAppropriate: "Yes"]]
    ]), 'CATEGORISER_USER', 'APPROVED', 'RECAT', null, null, null,
      1, null, 'BXI', 'B2345YZ', 'current_timestamp(2)', null, null,
            threeMonthsAgo, null, null, 'SUPERVISOR_USER')

    db.doCreateCompleteRow(-2, 12, JsonOutput.toJson([
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]],
      supervisor : [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      2, null, 'LEI', 'B2345YZ', 'current_timestamp(2)', null, null,
            threeMonthsAgoPlusOneDay, null, null, 'SUPERVISOR_USER')

    navigateToView()

    then: 'the latest cat details are correct'
    categories*.text() == ['C\nWarning\nCategory C',
                           'C\nWarning\nThe categoriser recommends category C',
                           'C\nWarning\nThe supervisor also recommends category C']

    when: "I look at the old categorisation"
    elite2Api.stubAgencyDetails('BXI')
    elite2Api.stubAgencyDetails('LPI')
    to ApprovedViewRecatPage, '12', sequenceNo: '1'

    then: 'the old cat details are shown correctly'
    categories*.text() == ['B\nWarning\nCategory B',
                           'B\nWarning\nThe categoriser recommends category B',
                           'B\nWarning\nThe supervisor also recommends category B']
  }

  private navigateToView() {

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage

    elite2Api.stubCategorised([12])
    elite2Api.stubAgencyDetails('LEI')
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()
    at SupervisorDonePage

    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false)
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')

    viewButtons[0].click()

    at ApprovedViewPage
  }
}
