package uk.gov.justice.digital.hmpps.cattool.specs.recat

import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.recat.DecisionPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.OasysInputPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.PrisonerBackgroundPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ReviewRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RiskAssessmentPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.SecurityInputPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.SupervisorRecatReviewPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.FEMALE_SECURITY_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.WOMEN_SUPERVISOR_USER


class WomenEstateRecatSpecification extends AbstractSpecification {

  def "A categoriser user can start a  recat from the landing page"() {
    given: 'A recategoriser is logged in'
    fixture.gotoTasklistRecatForWomen(false)
    at TasklistRecatPage

    elite2Api.stubAssessmentsWomen('ON700')
    elite2Api.stubAgencyDetails('PFI')
    riskProfilerApi.stubGetViolenceProfile('ON700', '`R`', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('ON700', 'R', true, false, true)
    riskProfilerApi.stubGetProfileWomenEscapeAlert('ON700', 'R', false, false)
    prisonerBackgroundButton.click()

    when: 'I go to the Prisoner background page'
    at PrisonerBackgroundPage
    headerValue*.text() == fixture.MINI_HEADER1
    extremismInfo.text() contains 'This person is not currently considered to be at risk of engaging in, or vulnerbale to, extremism.'
    violenceInfo.text() contains 'This person has not been reported as the perpetrator in any assaults in custody before.'
    escapeInfo.text().contains('This person is not on the E-List and does not have an Escape Risk Alert.')

    offenceDetails << 'offenceDetails text'
    submitButton.click()

    and: 'I go to Oasys page'
    at TasklistRecatPage
    oasysInputButton.click()
    at OasysInputPage
    headerValue*.text() == fixture.MINI_HEADER1
    reviewDate << '17/06/2020'
    oasysRelevantInfoNo.click()
    submitButton.click()
    at TasklistRecatPage

    and: 'I go to security page'
    at TasklistRecatPage
    elite2Api.stubAssessments(['ON700'])
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    riskProfilerApi.stubForTasklists('ON700', 'R', false)
    securityButton.click()
    at(new SecurityInputPage(bookingId: '700'))
    warningTextDiv.text().contains('All recategorisations must have a security review.')

    securityRadio = 'No'
    saveButton.click()

    and: 'I am at task recat page'
    at TasklistRecatPage
    securityButton.tag() == 'button'
    securityButton.@disabled

    and: 'correct data are saved and log in to security'
    def data = db.getData(700)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ["SECURITY_MANUAL"]
    fixture.sameDate(LocalDate.now(), data.start_date)
    data.referred_by == ["FEMALE_RECAT_USER"]
    fixture.sameDate(LocalDate.now(), data.referred_date)
    data.cat_type == ["RECAT"]
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Manually referred to Security ($today)")
    elite2Api.stubGetStaffDetailsByUsernameList()
    fixture.logout()
    elite2Api.stubGetOffenderDetailsByOffenderNoListWomen(700, 'ON700')
    prisonerSearchApi.stubSentenceData(['ON700'], [700], ['2019-01-28'])
    elite2Api.stubGetLatestCategorisationForWomenOffenders()
    fixture.loginAs(FEMALE_SECURITY_USER)

    and: 'The prisoner is present on security page'
    at SecurityHomePage
    prisonNos[0] == 'ON700'
    referredBy[0] == 'Firstname_female_recat_user Lastname_female_recat_user'
    days[0] == '' // sentence irrelevant
    dates[0] == '25/07/2019' // nextReviewDate
    catTypes[0] == 'Recat'

    and: 'The security user enters data'
    startButtons[0].click()
    at new SecurityReviewPage(bookingId: '700')
    securityText << 'security info text'
    submitButton.click()

    and: 'The prisoner status is back from security'
    at SecurityHomePage
    prisonNos.size() == 0
    noOffendersText == 'There are no referrals to review.'

    and: 'The recat task list page is displayed'
    fixture.logout()
    fixture.gotoTasklistRecatForWomen()
    at TasklistRecatPage
    $('#securitySection').text().contains("Completed Security ($today)")

    and: 'I go to risk assessment page'
    riskAssessmentButton.click()
    at RiskAssessmentPage
    headerValue*.text() == fixture.MINI_HEADER1
    lowerCategory << 'lower category text'
    higherCategory << 'higher category text'
    otherRelevantNo.click()
    submitButton.click()

    and: 'I go to category decision page'
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    headerValue*.text() == fixture.MINI_HEADER1
    categoryROption.click()
    submitButton.click()

    and: 'I go to next review date page'
    at TasklistRecatPage
    nextReviewDateButton.click()
    at NextReviewDateQuestionPage
    headerValue*.text() == fixture.MINI_HEADER1
    sixMonthsOption.click()
    submitButton.click()
    at NextReviewDatePage
    reviewDate.value() == SIX_MONTHS_AHEAD
    submitButton.click()
    at TasklistRecatPage
    elite2Api.stubAssessmentsWomen('ON700')
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    elite2Api.stubOffenceHistory('ON700')
    riskProfilerApi.stubGetViolenceProfile('ON700', '`R`', false, false, false)
    riskProfilerApi.stubGetExtremismProfile('ON700', 'R', true, false, true)
    riskProfilerApi.stubGetProfileWomenEscapeAlert('ON700', 'R', false, false)
    elite2Api.stubAgencyDetails('LNI')
    summarySection[0].text() == 'Check and submit'
    summarySection[1].text() == 'All tasks completed'
    continueButton.click()

    then: 'I am at review recat page'

    at ReviewRecatPage
    headerValue*.text() == fixture.FULL_HEADER2
    changeLinks.size() == 5
    securityInputSummary*.text() == ['', 'No', 'Yes', 'No', 'security info text']
    riskAssessmentSummary*.text() == ['', 'lower category text', 'higher category text', 'No']
    assessmentSummary*.text() == ['', 'Closed']
    nextReviewDateSummary*.text() == ['', SIX_MONTHS_AHEAD_ISO_DAY]
    elite2Api.stubCategoriseWomen('R', SIX_MONTHS_AHEAD_ISO)
    submitButton.click()
    at CategoriserSubmittedPage
    finishButton.click()
  }

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
    securityInputSummary*.text() == ['', 'No', 'Yes', 'No']
    riskAssessmentSummary*.text() == ['', 'lower category text', 'higher category text', 'No']
    assessmentSummary*.text() == ['', 'Closed']
    nextReviewDateSummary*.text() == ['', SIX_MONTHS_AHEAD_ISO_DAY]

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
    assert indeterminateWarning*.displayed
//    indeterminateWarning*.text() == ['!\nWarning\nThis person is serving an indeterminate sentence, and local establishments are not responsible for assessing their suitability for open conditions. You should categorise them to open conditions only if the Parole Board or Public Protection Casework Section has decided they are suitable.', '']

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
