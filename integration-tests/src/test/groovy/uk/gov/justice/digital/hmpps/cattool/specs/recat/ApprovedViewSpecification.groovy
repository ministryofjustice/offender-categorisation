package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ApprovedViewRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class ApprovedViewSpecification extends AbstractSpecification {

  def "The approved view page is correctly displayed (Cat overridden by supervisor)"() {

    db.createDataWithIdAndStatusAndCatType(-1, 11, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor: [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'RECAT')
    db.createDataWithIdAndStatusAndCatType(-2, 12, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor : [review: [supervisorCategoryAppropriate   : "No", supervisorOverriddenCategory: "D",
                             supervisorOverriddenCategoryText: "Here are the supervisor's comments on why the category was changed"]],
      openConditions: [riskLevels: [likelyToAbscond: "No"], riskOfHarm: [seriousHarm: "No"], foreignNational: [isForeignNational: "No"], earliestReleaseDate: [threeOrMoreYears: "No"]]
    ]), 'RECAT')
    db.createNomisSeqNo(12,7)

    when: 'the approved view page for B2345YZ is selected'
    navigateToView()

    then: 'the cat details are correct'
    categories*.text() == ['!\nWarning\nOpen category',
                           'C\nWarning\nThe categoriser recommends Category C',
                           'C\n!\nWarning\nThe recommended category was changed from Category C to open category']
    comments.text() == 'Here are the supervisor\'s comments on why the category was changed'
    openConditionsHeader.isDisplayed()

    when: "I click on the button"
    submitButton.click()

    then: "I return to the supervisor done page"
    at SupervisorDonePage
  }

  def "The approved view page is correctly displayed (recat role)"() {
    db.createDataWithIdAndStatusAndCatType(-1, 12, 'APPROVED', JsonOutput.toJson([
      recat: fixture.defaultRecat]), 'RECAT')

    when: 'the re-categoriser goes to the approved view page'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubCategorised([12])
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()
    at RecategoriserDonePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false)
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubAgencyDetails('LPI') // existing assessments
    elite2Api.stubAgencyDetails('LEI') // where this cat was done
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    viewButtons[0].click()

    then: 'the approved view page is shown'
    at ApprovedViewRecatPage
  }

  private navigateToView() {

    elite2Api.stubUncategorisedAwaitingApproval()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage

    elite2Api.stubCategorised([12])
    elite2Api.stubAgencyDetails('LEI')
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()
    at SupervisorDonePage

    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false)
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubAgencyDetails('LPI')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    viewButtons[1].click()

    at ApprovedViewRecatPage
  }
}
