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

  def "The recat tasklist for a categoriser is present"() {
    when: 'I go to the recat tasklist page'

    fixture.gotoTasklistRecat()

    then: 'The tasklist page is displayed'
    at TasklistRecatPage
    headerValue*.text() == fixture.FULL_HEADER
    headerLink.text() == 'Hillmob, Ant'
    headerLink.@href == 'http://localhost:3000/prisoner/B2345YZ'

    and: 'SOC data is stored and merged correctly'
    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.risk_profile[0].toString())
    response == [socProfile      : [nomsId: "B2345YZ", riskType: "SOC", transferToSecurity: false, provisionalCategorisation: 'C'],
                 extremismProfile: [notifyRegionalCTLead: false, increasedRiskOfExtremism: false]
    ]
    def row = data[0]
    row.booking_id == 12L
    row.user_id == "RECATEGORISER_USER"
    row.status == "STARTED"
    row.assigned_user_id == "RECATEGORISER_USER"
    row.sequence_no == 1
    row.prison_id == "LEI"
    row.offender_no == "B2345YZ"
    row.start_date.toLocalDate().equals(LocalDate.now())
    row.cat_type == "RECAT"
    row.review_reason == "DUE"
    row.due_by_date.toLocalDate().equals(LocalDate.of(2020, 1, 16))
  }

  def "The recat tasklist of YOI prisoner is correct"() {
    when: 'I go to the recat tasklist page for a YOI prisoner'

    fixture.gotoTasklistRecatForCatI() // get 404 from http://localhost:8080/api/bookings/12?basicInfo=false

    then: 'The tasklist page is displayed'
    at TasklistRecatPage
    headerValue[0].text() == 'C0001AA'
    headerValue[1].text() == '01/01/2018'
    headerValue[2].text() == 'YOI closed'

    and: 'data is stored correctly'
    def data = db.getData(21)
    def response = new JsonSlurper().parseText(data.risk_profile[0].toString())
    response == [socProfile      : [nomsId: 'C0001AA', riskType: 'SOC', transferToSecurity: false, provisionalCategorisation: 'I'],
                 extremismProfile: [notifyRegionalCTLead: false, increasedRiskOfExtremism: false]
    ]
    def row = data[0]
    row.booking_id == 21L
    row.offender_no == "C0001AA"
    row.cat_type == "RECAT"
    row.review_reason == "AGE"
    row.due_by_date.toLocalDate().equals(LocalDate.of(2039, 1, 1))
  }

  def "The recat tasklist page allows cancellation including security flag handling"() {
    db.createSecurityData('B2345YZ')

    when: 'I go to the tasklist page and cancel the categorisation'

    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    db.getSecurityData('B2345YZ')[0].status.value == 'PROCESSED'

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

  def "The tasklist page displays an alert when status is transferred to security"() {
    when: 'I go to the tasklist page'

    fixture.gotoTasklistRecat(true)
    at TasklistRecatPage

    then: 'the prisoner start button is locked'
    securityLinkDisabled.displayed
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securityInfo').text().contains("Automatically referred to Security ($today)")
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
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
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
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
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
