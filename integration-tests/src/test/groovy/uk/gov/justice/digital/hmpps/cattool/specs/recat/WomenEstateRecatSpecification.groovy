package uk.gov.justice.digital.hmpps.cattool.specs.recat

import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.recat.SupervisorRecatReviewPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.WOMEN_SUPERVISOR_USER


class WomenEstateRecatSpecification extends AbstractSpecification {

  def "The supervisor review page for a recat can be confirmed"() {

    given: 'supervisor is viewing the review page for ON700'
    db.createDataWithStatusAndCatType(700, 'AWAITING_APPROVAL', JsonOutput.toJson([
      recat: TestFixture.defaultRecatClosed]), 'RECAT', 'ON700')

    db.createNomisSeqNo(700, 5)
    db.createRiskProfileDataForExistingRow(700, '''{
      "socProfile": {"nomsId": "ON700", "riskType": "SOC", "transferToSecurity": false},
      "escapeProfile": {"nomsId": "ON700", "riskType": "ESCAPE", "activeEscapeList": false, "activeEscapeRisk": false},
      "violenceProfile": {"nomsId": "ON700", "riskType": "VIOLENCE", "displayAssaults": false, "numberOfAssaults": 0, "notifySafetyCustodyLead": false, "numberOfSeriousAssaults": 1, "numberOfNonSeriousAssaults": 1, "provisionalCategorisation": "R", "veryHighRiskViolentOffender": false},
      "extremismProfile": {"nomsId": "ON700", "riskType": "EXTREMISM", "notifyRegionalCTLead": false, "increasedRiskOfExtremism": false, "provisionalCategorisation": "R"}}''')
    db.createReviewReason(700, 'DUE')

    navigateToReview(false, false, false)

    headerValue*.text() == fixture.FULL_HEADER2
    changeLinks.size() == 0
    securityInputSummary*.text() == ['No', 'Yes', 'No']
    riskAssessmentSummary*.text() == ['lower category text', 'higher category text', 'No']
    assessmentSummary*.text() == ['Closed']
    nextReviewDateSummary*.text() == [SIX_MONTHS_AHEAD_ISO_DAY]

    when: 'the supervisor selects yes'
    elite2Api.stubSupervisorApprove("R")
    appropriateYes.click()
    submitButton.click()

    then: 'the review outcome page is displayed'
    at SupervisorReviewOutcomePage
    dcsSurveyLink.displayed
  }

  def "The supervisor review page with YOI options in provisional category"() {
    given: 'supervisor is viewing the review page for C0001AA'
    db.createDataWithStatusAndCatType(21, 'AWAITING_APPROVAL', JsonOutput.toJson([
      recat: TestFixture.defaultRecatYOIClosed]), 'RECAT', 'C0001AA')

    db.createNomisSeqNo(21, 5)
    db.createRiskProfileDataForExistingRow(21, '''{
      "socProfile": {"nomsId": "C0001AA", "riskType": "SOC", "transferToSecurity": false},
      "escapeProfile": {"nomsId": "C0001AA", "riskType": "ESCAPE", "activeEscapeList": false, "activeEscapeRisk": false},
      "violenceProfile": {"nomsId": "C0001AA", "riskType": "VIOLENCE", "displayAssaults": false, "numberOfAssaults": 0, "notifySafetyCustodyLead": false, "numberOfSeriousAssaults": 1, "numberOfNonSeriousAssaults": 1, "provisionalCategorisation": "I", "veryHighRiskViolentOffender": false},
      "extremismProfile": {"nomsId": "C0001AA", "riskType": "EXTREMISM", "notifyRegionalCTLead": false, "increasedRiskOfExtremism": false, "provisionalCategorisation": "I"}}''')
    db.createReviewReason(21, 'DUE')

    navigateToReviewYOI(true, false, false)

    when: 'the supervisor selects yes'
    elite2Api.stubSupervisorApprove("I")
    appropriateYes.click()
    overriddenCategoryJ.@type == 'radio'
    overriddenCategoryR.@type == 'radio'
    overriddenCategoryT.@type == 'radio'
    submitButton.click()

    then: 'the review outcome page is displayed'
    at SupervisorReviewOutcomePage
    dcsSurveyLink.displayed
  }

  def "The supervisor review page with YOI - indeterminate sentence"() {
    when: 'supervisor is viewing the review page for C0001AA'
    db.createDataWithStatusAndCatType(21, 'AWAITING_APPROVAL', JsonOutput.toJson([
      recat: TestFixture.defaultRecatYOIClosed]), 'RECAT', 'C0001AA')
    db.createNomisSeqNo(21, 5)

    navigateToReviewYOI(true,true,false)
    appropriateNo.click()

    then: 'the indeterminate warning is shown'
    overriddenCategoryJ.click()
    indeterminateWarning*.text() == ['!\nWarning\nThis person is serving an indeterminate sentence, and local establishments are not responsible for assessing their suitability for open conditions. You should categorise them to open conditions only if the Parole Board or Public Protection Casework Section has decided they are suitable.', '']

  }

  def "The supervisor review page for recat - indeterminate sentence"() {
    when: 'supervisor is viewing the review page for ON700'
    db.createDataWithStatusAndCatType(700, 'AWAITING_APPROVAL', JsonOutput.toJson([
      recat: TestFixture.defaultRecatClosed]), 'RECAT', 'ON700')
    db.createNomisSeqNo(700, 5)

    navigateToReview(false,true,false)
    appropriateNo.click()

    then: 'the indeterminate warning is shown'
    indeterminateWarning*.text() == ['!\nWarning\nThis person is serving an indeterminate sentence, and local establishments are not responsible for assessing their suitability for open conditions. You should categorise them to open conditions only if the Parole Board or Public Protection Casework Section has decided they are suitable.', '']

  }

  private navigateToReview(youngOffender = false, indeterminateSentence = false, initial = false) {

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    prisonerSearchApi.stubSentenceData(['ON700'], [700], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    elite2Api.stubUncategorisedAwaitingApproval('PFI')

    fixture.loginAs(WOMEN_SUPERVISOR_USER)

    at SupervisorHomePage

    elite2Api.stubGetOffenderDetailsWomen(700, "ON700", youngOffender, indeterminateSentence, 'R')
    elite2Api.stubAssessmentsWomen(['ON700'])
    elite2Api.stubAgencyDetails('PFI')
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    startButtons[0].click()
    at SupervisorRecatReviewPage
  }

  private navigateToReviewYOI(youngOffender = false, indeterminateSentence = false, initial = true) {

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    prisonerSearchApi.stubSentenceData(['C0001AA'], [21], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    elite2Api.stubUncategorisedAwaitingApprovalForWomenYOI('PFI')

    fixture.loginAs(WOMEN_SUPERVISOR_USER)

    at SupervisorHomePage

    elite2Api.stubGetOffenderDetailsWomenYOI(21, 'C0001AA', true, indeterminateSentence,'I')
    elite2Api.stubAssessmentsWomen(['C0001AA'])
    elite2Api.stubAgencyDetails('PFI')
    elite2Api.stubSentenceDataGetSingle('C0001AA', '2014-11-23')
    startButtons[0].click()
    at SupervisorRecatReviewPage
  }
}
