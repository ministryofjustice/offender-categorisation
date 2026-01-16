package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CancelConfirmedPage
import uk.gov.justice.digital.hmpps.cattool.pages.CancelPage
import uk.gov.justice.digital.hmpps.cattool.pages.ErrorPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER

class TasklistRecatSpecification extends AbstractSpecification {

  def "The recat tasklist page allows cancellation including security flag handling"() {
    db.createSecurityData('B2345YZ')

    when: 'I go to the tasklist page and cancel the categorisation'

    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    db.getSecurityData('B2345YZ')[0].status == 'PROCESSED'

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubAgencyDetails('LPI') // existing assessments
    cancelLink.click()
    at CancelPage
    confirmNo.click()
    submitButton.click()
    at TasklistRecatPage
    cancelLink.click()
    at CancelPage
    elite2Api.stubSetInactive(12, 'PENDING')
    confirmYes.click()
    submitButton.click()

    then: 'the cancel confirmed page is shown with finish and manage links'
    at CancelConfirmedPage
    finishButton.displayed
    manageLink.displayed

    and: 'any security flag is reset'
    db.getSecurityData('B2345YZ')[0].status == 'NEW'
  }

  def "The recat tasklist correctly creates a subsequent database sequence when init record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]), 'INITIAL')

    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    alertsApi.stubGetActiveOcgmAlerts('B2345YZ', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 4)
    // TODO: was not in the to-do list so have to go directly, BUT NOW IS with wrong button label 'edit'
    to TasklistRecatPage, '12', reason: 'DUE'

    then: 'The database row is created correctly'
    def data = db.getData(12)
    data.status == ['APPROVED', 'STARTED']
    data.cat_type*.toString() == ['INITIAL', 'RECAT']
    data.sequence_no == [1, 2]
    data.review_reason*.toString() == ['DUE', 'DUE']
  }

  def "The recat tasklist correctly creates a subsequent database sequence when a completed recat record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatusAndCatType(12, 'APPROVED', '{}', 'RECAT')

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    then: 'The database row is created correctly'
    def data = db.getData(12)
    data.status == ['APPROVED', 'STARTED']
    data.cat_type*.toString() == ['RECAT', 'RECAT']
    data.sequence_no == [1, 2]
  }

  def "The recat tasklist shows an error when an incomplete init record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', '{}', 'INITIAL')

    // not in todo list so have to go directly
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    alertsApi.stubGetActiveOcgmAlerts('B2345YZ', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 4)
    via TasklistRecatPage, '12'

    then: 'The correct error is displayed'
    at ErrorPage
    errorSummaryTitle.text() == 'Error: The initial categorisation is still in progress'
  }

  def "The recat tasklist correctly continues the current recat when an incomplete recat record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT')
    elite2Api.stubGetUserDetails(CATEGORISER_USER, Caseload.LEI.id)
    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    then: 'The single database row is used'
    def data = db.getData(12)
    data.status == ['STARTED']
    data.cat_type*.toString() == ['RECAT']
    data.sequence_no == [1]
  }
}
