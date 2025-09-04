package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.CancelConfirmedPage
import uk.gov.justice.digital.hmpps.cattool.pages.CancelPage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class TasklistSpecification extends AbstractSpecification {

  def "The tasklist for a categoriser is present and can display multiple sentences"() {
    when: 'I go to the tasklist page'
    db.createRiskProfileData(12, JsonOutput.toJson([
      "escapeProfile": [nomsId: "Dummy"]
    ]))
    fixture.gotoTasklist(false, true)

    then: 'The tasklist page is displayed with multiple sentences'
    at(new TasklistPage(bookingId: '12'))
    sentenceTableRow1*.text() == ['2', '31/12/2018', '6 years, 3 months', '', 'Std sentence']
    sentenceTableRow2*.text() == ['4', '31/03/2019', '4 years, 2 months', '2', 'Recall 14 days']
    !checkAndSubmitLink
    checkAndSubmitLinkDisabled.displayed

    and: 'SOC data is stored and merged correctly'
    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.risk_profile[0].toString())
    response == [socProfile      : [nomsId: "B2345YZ", riskType: "SOC", transferToSecurity: false, provisionalCategorisation: 'C'],
                 extremismProfile: [notifyRegionalCTLead: false, increasedRiskOfExtremism: false],
                 escapeProfile   : [nomsId: "Dummy"]]
  }

  def "The continue button behaves correctly"() {
    when: 'I go to the tasklist page with all sections complete'
    db.createData(12, JsonOutput.toJson([
      ratings       : [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges  : [furtherCharges: "No"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"],
        nextReviewDate  : [date: "14/12/2019"]
      ],
      openConditions: [riskLevels: [likelyToAbscond: "Yes"]]]))
    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    then: 'The continue button takes me to the review page'
    checkAndSubmitLink.displayed
    !checkAndSubmitLinkDisabled
  }

  def "The continue button behaves correctly when openconditions is added to list items"() {
    when: 'I go to the tasklist page with all sections complete'
    db.createData(12, JsonOutput.toJson([
      ratings                   : [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges  : [furtherCharges: "No"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"],
        nextReviewDate  : [date: "14/12/2019"]
      ], openConditionsRequested: true]))
    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    then: 'The continue button takes me to the review page'
    checkAndSubmitLink
  }

  def "The tasklist page displays an alert when status is transferred to security"() {
    when: 'I go to the tasklist page'

    fixture.gotoTasklist(true)
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')

    then: 'the prisoner start button is locked'
    securityLinkDisabled.displayed
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Automatically referred to Security ($today)")
    summarySection[0].text() == 'Check and submit'

    when: 'a security user views their homepage'
    prisonerSearchApi.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    logoutLink.click()
    elite2Api.stubGetStaffDetailsByUsernameList()
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    fixture.loginAs(SECURITY_USER)

    then: 'this prisoner is present with automatic referral'
    at SecurityHomePage
    referredBy[0] == 'Automatic'

    when: 'the security user reads the page'
    startButtons[0].click()
    then: 'No note added text is displayed'
    at new SecurityReviewPage(bookingId: '12')
    pAuto.displayed

  }

  def "The tasklist page correctly populates the database"() {
    when: 'I go to the tasklist page'

    fixture.gotoTasklist(false)

    then: 'A database row is created containing correct basic info'
    at(new TasklistPage(bookingId: '12'))
    def data = db.getData(12)[0]
    data.booking_id == 12L
    data.user_id == "CATEGORISER_USER"
    data.status == "STARTED"
    data.assigned_user_id == "CATEGORISER_USER"
    data.sequence_no == 1
    data.prison_id == "LEI"
    data.offender_no == "B2345YZ"
    data.start_date.toLocalDate().equals(LocalDate.now())
    data.cat_type == "INITIAL"
    data.due_by_date.toLocalDate().equals(LocalDate.of(2019, 8, 29))
  }

  def "The tasklist page allows cancellation"() {
    when: 'I go to the tasklist page and cancel the categorisation'

    fixture.gotoTasklist(false)
    at TasklistPage
    cancelLink.click()
    at CancelPage
    confirmNo.click()
    submitButton.click()
    at TasklistPage
    cancelLink.click()
    at CancelPage
    elite2Api.stubSetInactive(12, 'PENDING')
    confirmYes.click()
    submitButton.click()

    then: 'the cancel confirmed page is shown with finish and manage links'
    at CancelConfirmedPage
    finishButton.displayed
    manageLink.displayed
  }

  def "Initial cat after an existing cat is allowed"() {
    when: 'I go to the tasklist page with an existing completed cat'
    db.createDataWithStatus(12, 'APPROVED', JsonOutput.toJson([ratings: []]))
    fixture.gotoTasklist()
    go '/tasklist/12' // no clickable button available, so force to page

    then: 'A new database row is created'
    at TasklistPage
    def data = db.getData(12)
    data.booking_id == [12L, 12L]
    data.sequence_no == [1, 2]
    data.status == ['APPROVED', 'STARTED']
  }
}
