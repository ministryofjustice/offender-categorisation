package uk.gov.justice.digital.hmpps.cattool.specs.recat

import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER

class NextReviewDateSpecification extends AbstractSpecification {

  def setup() {
    elite2Api.stubAgencyDetails('LPI')
    elite2Api.stubAssessments('B2345YZ')
  }

  def "The page saves details correctly - 6 months"() {
    when: 'I go to the Next Review Date Question page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    nextReviewDateLink.click()

    then: 'The page is displayed'
    at NextReviewDateQuestionPage
    headerValue*.text() == fixture.MINI_HEADER

    when: "6 months is selected"
    sixMonthsOption.click()
    submitButton.click()

    then: "I continue to the Next Review Date page"
    at NextReviewDatePage
    reviewDate.value() == SIX_MONTHS_AHEAD

    when: 'Populated date is used, saved and accessed'
    submitButton.click()
    at TasklistRecatPage
    nextReviewDateLink.click()
    at NextReviewDateEditingPage

    then: "data is correctly populated"
    chosenDate.text() == SIX_MONTHS_AHEAD

    when: "we decide to change the data"
    changeLink.click()
    at NextReviewDateQuestionPage
    specificOption.click()
    submitButton.click()
    at NextReviewDatePage

    then: "data is correctly blanked"
    form.date == ''

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [nextReviewDate: [date: SIX_MONTHS_AHEAD, indeterminate: "false"]]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def "Validation"() {
    when: 'I go to the Next Review Date Question page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    nextReviewDateLink.click()

    then: 'The page is displayed'
    at NextReviewDateQuestionPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Nothing is selected - validation kicks in'
    submitButton.click()
    at NextReviewDateQuestionPage

    then: "Error is displayed"
    waitFor {
      errorSummaries*.text() == ['Please select a choice']
      errors.text() == 'Error:\nPlease select a choice'
    }


    when: "specific date is selected"
    specificOption.click()
    submitButton.click()

    then: "I continue to the Next Review Date page"
    at NextReviewDatePage
    reviewDate.value() == ''

    when: 'No date is entered - validation kicks in'
    submitButton.click()
    at NextReviewDatePage

    then: "Error is displayed"
    waitFor {
      errorSummaries*.text() == ['The review date must be a real date']
      errors.text().toString() == "Error:\nThe review date must be a real date"
    }
  }

  def "The nextReviewDate Standalone page saves details correctly - in PG"() {

    given: 'there is an approved db record'
    db.createDataWithStatusAndCatType(12, 'APPROVED',
      JsonOutput.toJson([recat: TestFixture.defaultRecat]),
      'RECAT', 'B2345YZ');

    when: 'I go to the Next Review Date Standalone page'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ')
    go '/12'
    at LandingPage
    nextReviewDateButton.click()

    then: 'The page is displayed with Nomis next-review-date'
    at NextReviewDateStandalonePage

    when: 'invalid date is entered, with no reason'
    reviewDate << 'rubbish'
    submitButton.click()

    then: 'there are 2 validation errors'
    waitFor {
      errorSummaries*.text() == ['The review date must be a real date', 'Enter reason for date change']
      errors*.text() == ['Error:\nThe review date must be a real date', 'Error:\nEnter reason for date change']
    }

    when: 'reason entered'
    reason = 'A test reason'
    submitButton.click()

    then: 'there is 1 validation error'
    waitFor {
      errorSummaries*.text() == ['The review date must be a real date']
      errors.text() == 'Error:\nThe review date must be a real date'
    }

    when: 'date is modified'
    elite2Api.stubUpdateNextReviewDate(THREE_MONTHS_AHEAD_ISO)
    reviewDate = THREE_MONTHS_AHEAD
    submitButton.click()

    then: "we return to the landing page, the endpoint was called and database has been updated"
    at LandingPage
    elite2Api.verifyUpdateNextReviewDate(THREE_MONTHS_AHEAD_ISO) == null
    nextReviewDateHistory[0].find('td')[0].text() == THREE_MONTHS_AHEAD_LONG
    nextReviewDateHistory[0].find('td')[1].text() == 'A test reason'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.recat.nextReviewDate == [date: '14/12/2019'] // left unchanged

    def nextReviewData = db.getNextReviewData('B2345YZ')
    nextReviewData[0].reason == 'A test reason'
    nextReviewData[0].next_review_date.toString() == THREE_MONTHS_AHEAD_ISO
    nextReviewData[0].changed_by == 'RECATEGORISER_USER'
    nextReviewData.size() == 1
  }

  def "The nextReviewDate Standalone page saves details correctly - not in PG"() {
    when: 'I go to the Next Review Date Standalone page'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ')
    go '/12'
    at LandingPage
    nextReviewDateButton.click()

    then: 'The page is displayed with existing date'
    at NextReviewDateStandalonePage

    when: 'date is modified'
    elite2Api.stubUpdateNextReviewDate(THREE_MONTHS_AHEAD_ISO)
    reviewDate = THREE_MONTHS_AHEAD
    reason = 'A test reason'
    submitButton.click()

    then: "we return to the landing page, the endpoint was called and no form data exists"
    at LandingPage
    elite2Api.verifyUpdateNextReviewDate(THREE_MONTHS_AHEAD_ISO) == null
    db.getData(12).empty

    def nextReviewData = db.getNextReviewData('B2345YZ')
    nextReviewData[0].reason == 'A test reason'
    nextReviewData[0].next_review_date.toString() == THREE_MONTHS_AHEAD_ISO
    nextReviewData[0].changed_by == 'RECATEGORISER_USER'
  }

  def "The nextReviewDate Standalone page saves details correctly - in progress"() {

    given: 'there is an in-progress db record'
    db.createDataWithStatusAndCatType(12, 'AWAITING_APPROVAL', '{}',
      'RECAT', 'B2345YZ');

    when: 'I go to the landing page'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ')
    go '/12'
    at LandingPage

    then: 'the next review button is not present'
    !nextReviewDateButton.displayed

    when: 'I force the next review page'
    via NextReviewDateStandalonePage, '12'

    then: 'The error page is displayed'
    at ErrorPage
    errorSummaryTitle.text() == 'Categorisation is in progress: please use the tasklist to change date'
  }
}
