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

  def "The approved view page is correctly displayed (suggested Cat)"() {

    db.createDataWithIdAndStatusAndCatType(-1, 11, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor: [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'RECAT')
    db.createDataWithIdAndStatusAndCatType(-2, 12, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor: [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'RECAT')
    db.createNomisSeqNo(12,7)

    db.createRiskProfileDataForExistingRow(12, '''{
      "socProfile": {"nomsId": "B2345YZ", "riskType": "SOC", "transferToSecurity": false},
      "escapeProfile": {"nomsId": "B2345YZ", "riskType": "ESCAPE", "activeEscapeList": true, "activeEscapeRisk": true,
        "escapeListAlerts" : [ { "active": true, "comment": "First xel comment", "expired": true, "alertCode": "XEL", "dateCreated": "2016-09-14", "alertCodeDescription": "Escape List"}]
      },
      "violenceProfile": {"nomsId": "B2345YZ", "riskType": "VIOLENCE", "displayAssaults": true, "numberOfAssaults": 5, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 2, "numberOfNonSeriousAssaults": 3, "provisionalCategorisation": "C", "veryHighRiskViolentOffender": false},
      "extremismProfile": {"nomsId": "B2345YZ", "riskType": "EXTREMISM", "notifyRegionalCTLead": true, "increasedRiskOfExtremism": true, "provisionalCategorisation": "C"}}''')
    db.createReviewReason(12, 'AGE')

    when: 'the approved view page for B2345YZ is selected'
    navigateToView()

    then: 'the cat details are correct and full prisoner background data is shown'
    headerValue*.text() == fixture.FULL_HEADER
    categories*.text() == ['C\nWarning\nCategory C',
                           'C\nWarning\nThe categoriser recommends Category C',
                           'C\nWarning\nThe supervisor also recommends Category C']
    !comments.displayed
    comments.size() == 0
    !openConditionsHeader.isDisplayed()
    prisonerBackgroundSummary*.text() == [
      '', 'Age 21', ('Categorisation date Category decision Review location\n' +
      '24/03/2013 B LPI prison\n' +
      '08/06/2012 A LPI prison'),
      'This person has been reported as the perpetrator in 5 assaults in custody before, including 2 serious assaults and 3 non-serious assaults in the past 12 months. You should consider the dates and context of these assaults in your assessment.',
      'This person is considered an escape risk\nE-List: First xel comment 2016-09-14 (expired)',
      'This person is at risk of engaging in, or vulnerable to, extremism.', '']
  }

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
