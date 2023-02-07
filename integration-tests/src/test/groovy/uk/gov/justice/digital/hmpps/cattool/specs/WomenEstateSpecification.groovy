package uk.gov.justice.digital.hmpps.cattool.specs

import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSecurityInputPage
import uk.gov.justice.digital.hmpps.cattool.pages.NextReviewDatePage
import uk.gov.justice.digital.hmpps.cattool.pages.NextReviewDateQuestionPage
import uk.gov.justice.digital.hmpps.cattool.pages.ReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserEscapePage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.ExtremismPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.ViolencePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.FEMALE_USER


class WomenEstateSpecification extends AbstractSpecification {

  def "A categoriser user can start a initial cat from the landing page"() {
    given: 'A categoriser is logged in'

    elite2Api.stubUncategorisedNoStatus(700, 'PFI')
    prisonerSearchApi.stubSentenceData(['ON700'], [700], [TODAY.plusDays(-3).toString()])
    fixture.loginAs(FEMALE_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(700, "ON700")
    riskProfilerApi.stubForTasklists('ON700', 'T', false)
    startButtons[0].click()
    at(new TasklistPage(bookingId: '700'))
    headerValue*.text() == fixture.FULL_HEADER1
//    headerValue*.text() == ['ON700', '17/02/1970', 'C-04-02', 'Coventry', 'A Felony', 'Another Felony', 'Latvian', '02/02/2020']
    elite2Api.stubAssessments(['ON700'])
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    elite2Api.stubOffenceHistory('ON700')
    offendingHistoryButton.click()
    at(new CategoriserOffendingHistoryPage(bookingId: '700'))
    previousConvictionsNo.click()
    saveButton.click()
    at TasklistPage

    when: 'I go to the violence page'
    riskProfilerApi.stubGetViolenceProfile('ON700', 'T', false, false, false)
    violenceButton.click()
    at ViolencePage
    !warning.displayed
    highRiskOfViolenceNo.click()
    seriousThreatNo.click()
    submitButton.click()

    and: 'I go to risk escape page'
    at(new TasklistPage(bookingId: '700'))
    elite2Api.stubAssessments(['ON700'])
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('ON700', 'T', true, false)
    escapeButton.click()
    at(new CategoriserEscapePage(bookingId: '700'))
    escapeOtherEvidenceRadio = 'No'
    escapeCatBRadio = 'Yes'
    escapeCatBTextarea << 'escape cat b explanation'
    saveButton.click()

    and: 'I go to the extremism page'
    at(new TasklistPage(bookingId: '700'))
    riskProfilerApi.stubGetExtremismProfile('ON700', 'T', true, false)
    extremismButton.click()
    at ExtremismPage
    previousTerrorismOffencesYes.click()
    previousTerrorismOffencesText << "Some risk text"
    submitButton.click()
    at TasklistPage

    and: 'I go to security page'
    at(new TasklistPage(bookingId: '700'))
    elite2Api.stubAssessments(['ON700'])
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
    riskProfilerApi.stubForTasklists('ON700', 'T', false)
    securityButton.click()
    at(new CategoriserSecurityInputPage(bookingId: '700'))
    securityRadio = 'No'
    saveButton.click()
    at TasklistPage

    and: 'I go to the Next Review Date Question page'
    nextReviewDateButton.click()
    at NextReviewDateQuestionPage
    sixMonthsOption.click()
    submitButton.click()
    at NextReviewDatePage
    submitButton.click()
    at TasklistPage

//    elite2Api.stubAssessments('ON700')
//    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')
//    elite2Api.stubOffenceHistory('ON700')
//    riskProfilerApi.stubGetEscapeProfile('ON700', 'T', true, false)
//    riskProfilerApi.stubGetViolenceProfile('ON700', 'T', false, false, false)
//    riskProfilerApi.stubGetExtremismProfile('ON700', 'T', true, false)
//    riskProfilerApi.stubGetLifeProfile('ON700', 'T')
    summarySection[0].text() == 'Review and categorisation'
    summarySection[1].text() == 'All tasks completed'

    continueButton.click()

    then: 'verify details on review page'
    at ReviewPage
    headerValue*.text() == fixture.FULL_HEADER1
    changeLinks.size() == 10
    offendingHistorySummary*.text() == ['Cat A (2012)', 'Libel (21/02/2019)\nSlander (22/02/2019 - 24/02/2019)\nUndated offence', 'Yes\nsome convictions']
    violenceRatingSummary*.text() == ['5', '2', 'No', 'No']
    escapeRatingSummary*.text() == ['No', 'No', 'Yes\nescape cat b explanation']
    extremismRatingSummary*.text() == ['No', 'No']
    securityInputSummary*.text() == ['No', 'Yes', 'No']
    nextReviewDateSummary*.text() == ['Sunday 30 July 2023']
  }

}
