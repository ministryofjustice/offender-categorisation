package uk.gov.justice.digital.hmpps.cattool.specs

import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserEscapePage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.DecisionPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.ExtremismPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.ViolencePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.FEMALE_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.WOMEN_SUPERVISOR_USER

class WomenEstateSpecification extends AbstractSpecification {

  def "A categoriser user can start a initial cat from the landing page"() {
    given: 'A categoriser is logged in'

    elite2Api.stubUncategorisedNoStatus(700, 'PFI')
    prisonerSearchApi.stubSentenceData(['ON700'], [700], [TODAY.plusDays(-3).toString()])
    fixture.loginAs(FEMALE_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetailsWomen(700, "ON700", 'U(Unsentenced)')
    riskProfilerApi.stubForTasklists('ON700', 'U(Unsentenced)', false)
    startButtons[0].click()
    at(new TasklistPage(bookingId: '700'))
    headerValue*.text() == fixture.FULL_HEADER1
    elite2Api.stubAssessmentsWomen(['ON700'])
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    elite2Api.stubOffenceHistory('ON700')
    offendingHistoryButton.click()
    at(new CategoriserOffendingHistoryPage(bookingId: '700'))
    previousConvictionsNo.click()
    saveButton.click()
    at TasklistPage

    when: 'I go to the violence page'
    riskProfilerApi.stubGetViolenceProfile('ON700', 'U(Unsentenced)', false, false, false)
    violenceButton.click()
    at ViolencePage
    !warning.displayed
    highRiskOfViolenceNo.click()
    seriousThreatNo.click()
    submitButton.click()

    and: 'I go to risk escape page'
    at(new TasklistPage(bookingId: '700'))
    elite2Api.stubAssessmentsWomen(['ON700'])
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    riskProfilerApi.stubGetProfileWomenEscapeAlert('ON700', 'U(Unsentenced)', false, false)
    escapeButton.click()
    at(new CategoriserEscapePage(bookingId: '700'))
    escapeOtherEvidenceRadio = 'No'
    saveButton.click()

    and: 'I go to the extremism page'
    at(new TasklistPage(bookingId: '700'))
    riskProfilerApi.stubGetExtremismProfile('ON700', 'U(Unsentenced)', true, false, true)
    extremismButton.click()
    at ExtremismPage
    previousTerrorismOffencesYes.click()
    previousTerrorismOffencesText << "Some risk text"
    submitButton.click()
    at TasklistPage

    and: 'I go to security page'
    at(new TasklistPage(bookingId: '700'))
    elite2Api.stubAssessmentsWomen(['ON700'])
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    riskProfilerApi.stubForTasklists('ON700', 'U(Unsentenced)', false)
    securityButton.click()
    at(new CategoriserSecurityInputPage(bookingId: '700'))
    securityRadio = 'No'
    saveButton.click()
    at TasklistPage

    and: 'I go to category decision page'
    at(new TasklistPage(bookingId: '700'))
    decisionButton.click()
    at DecisionPage
    closedOption.click()
    submitButton.click()
    at TasklistPage

    and: 'I go to the Next Review Date Question page'
    nextReviewDateButton.click()
    at NextReviewDateQuestionPage
    sixMonthsOption.click()
    submitButton.click()
    at NextReviewDatePage
    reviewDate.value() == SIX_MONTHS_AHEAD
    submitButton.click()
    at TasklistPage

    elite2Api.stubAssessmentsWomen('ON700')
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    elite2Api.stubOffenceHistory('ON700')
    riskProfilerApi.stubGetProfileWomenEscapeAlert('ON700', 'U(Unsentenced)', false, false)
    riskProfilerApi.stubGetViolenceProfile('ON700', 'U(Unsentenced)', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('ON700', 'U(Unsentenced)', true, false, true)
    riskProfilerApi.stubGetLifeProfile('ON700', 'R')
    summarySection[0].text() == 'Review and categorisation'
    summarySection[1].text() == 'All tasks completed'
    continueButton.click()

    and: 'verify details on review page'
    at ReviewPage
    elite2Api.stubCategoriseWomen('R', SIX_MONTHS_AHEAD_ISO)
    elite2Api.stubUncategorisedNoStatus(700, 'PFI')
    elite2Api.stubGetOffenderDetails(700, "ON700")
    headerValue*.text() == fixture.FULL_HEADER1
    changeLinks.size() == 9
    offendingHistorySummary*.text() == ['No Cat A, Restricted', 'Libel (21/02/2019)\nSlander (22/02/2019 - 24/02/2019)\nUndated offence', 'No']
    violenceRatingSummary*.text() == ['5', '2', 'No', 'No']
    escapeRatingSummary*.text() == ['No', 'No', 'No', 'No']
    extremismRatingSummary*.text() == ['Yes', 'Yes\nSome risk text']
    securityInputSummary*.text() == ['No', 'No', 'No']
    categoryDecisionSummary*.text() == ['Closed']
    nextReviewDateSummary*.text() == [SIX_MONTHS_AHEAD_ISO_DAY]
    submitButton.click()

    then: 'I am at categoriser submit page'
    at CategoriserSubmittedPage
    finishButton.click()

  }

  def "The supervisor review page can be confirmed for Women Estate"() {
    given: 'supervisor is viewing the review page for ON700'
    db.createDataWithStatusWomen(-1, 700, 'AWAITING_APPROVAL', JsonOutput.toJson([ratings    : TestFixture.defaultRatingsClosed,
                                                                                  categoriser: [provisionalCategory: [suggestedCategory: "R", categoryAppropriate: "Yes"]]]), 'FEMALE_USER', 'PFI')
    db.createNomisSeqNo(700, 5)
    db.createRiskProfileDataForExistingRow(700, JsonOutput.toJson([history : [catType: 'No CatA', finalCat: 'Cat R'],
                                                                   offences: [[bookingId: 700, offenceDate: '2019-02-21', offenceDescription: 'Libel'],
                                                                              [bookingId: 700, offenceDate: '2019-02-22', offenceRangeDate: '2019-02-24', offenceDescription: 'Slander'],
                                                                              [bookingId: 700, offenceDescription: 'Undated offence']]]))

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    prisonerSearchApi.stubSentenceData(['ON700'], [700], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    elite2Api.stubUncategorisedAwaitingApproval('PFI')
    navigateToReview()
    headerValue*.text() == fixture.FULL_HEADER1
    offendingHistorySummary*.text() == ['No CAT A, Restricted', 'Libel (21/02/2019)\nSlander (22/02/2019 - 24/02/2019)\nUndated offence', 'No']

    when: 'the supervisor selects yes'
    elite2Api.stubSupervisorApprove("R")
    appropriateYes.click()
    submitButton.click()

    then: 'the review outcome page is displayed'
    at SupervisorReviewOutcomePage
    dcsSurveyLink.displayed
  }

  private navigateToReview(youngOffender = false, indeterminateSentence = false, initial = true) {
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    prisonerSearchApi.stubSentenceData(['ON700'], [700], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    elite2Api.stubUncategorisedAwaitingApproval('PFI')

    fixture.loginAs(WOMEN_SUPERVISOR_USER)
    at SupervisorHomePage
    elite2Api.stubGetOffenderDetailsWomen(700, "ON700",'U(Unsentenced)')
    elite2Api.stubAssessmentsWomen(['ON700'])
    elite2Api.stubAgencyDetails('PFI')
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    startButton.click()
    at SupervisorReviewPage
  }
}
