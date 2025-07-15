package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserAwaitingApprovalViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage

import java.time.LocalDate
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class HomePageSpecification extends AbstractSpecification {

  def "The home page for a categoriser is present"() {
    db.createDataWithStatus(-2, 32, 'STARTED', '{}')
    db.createDataWithStatus(-3, 33, 'AWAITING_APPROVAL', '{}')
    db.createDataWithStatus(-4, 34, 'APPROVED', '{}')
    db.createDataWithStatus(-5, 36, 'STARTED', '{}')
    db.createDataWithStatus(-6, 37, 'AWAITING_APPROVAL', '{}')
    db.createDataWithStatus(-7, 38, 'APPROVED', '{}')
    db.createDataWithStatus(-8, 39, 'SUPERVISOR_BACK', '{}')
    // This one (Anthill Mob) was started manually and does not come back from the nomis query:
    db.doCreateCompleteRow(-10, 40, '{}', 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null,
      null, 1, null, 'LEI', 'dummy', 'current_timestamp(2)', null, null,
      null, null, null, null, 'MANUAL')

    when: 'I go to the home page as categoriser'

    def sentenceStartDates = [
      B0031AA: TODAY.minusDays(55),
      B0032AA: TODAY.minusDays(50),
      B0033AA: TODAY.minusDays(47),
      B0034AA: TODAY.minusDays(43),
      B0035AA: TODAY.minusDays(39),
      B0036AA: TODAY.minusDays(15),
      B0037AA: TODAY.minusDays(14),
      B0038AA: TODAY.minusDays(5),
      B0039AA: TODAY.minusDays(1),
      B0040AA: TODAY.minusDays(70)
    ]

    elite2Api.stubUncategorisedFull()
    prisonerSearchApi.stubSentenceData(
      sentenceStartDates.keySet() as List,
      (31..40).toList(),
      sentenceStartDates.values()*.toString()
    )
    elite2Api.stubGetBasicOffenderDetails(40, 'B0040AA')

    fixture.loginAs(CATEGORISER_USER)

    then: 'The categoriser home page is displayed'
    at CategoriserHomePage

    names == [
      'Supervisor_back, Awaiting B0039AA',
      'Hillmob, Ant B0040AA',
      'Missing, Awaiting B0031AA',
      'Started, Awaiting B0032AA',
      'Awaiting, Awaiting B0033AA',
      'Approved, Awaiting B0034AA',
      'Missing, Uncategorised B0035AA',
      'Started, Uncategorised B0036AA',
      'Awaiting, Uncategorised B0037AA',
      'Approved, Uncategorised B0038AA'
    ]

    days == ['1', '70', '55', '50', '47', '43', '39', '15', '14', '5']

    dates == [
      fixture.calculateReviewDate(sentenceStartDates.B0039AA),
      fixture.calculateReviewDate(sentenceStartDates.B0040AA),
      fixture.calculateReviewDate(sentenceStartDates.B0031AA),
      fixture.calculateReviewDate(sentenceStartDates.B0032AA),
      fixture.calculateReviewDate(sentenceStartDates.B0033AA),
      fixture.calculateReviewDate(sentenceStartDates.B0034AA),
      fixture.calculateReviewDate(sentenceStartDates.B0035AA),
      fixture.calculateReviewDate(sentenceStartDates.B0036AA),
      fixture.calculateReviewDate(sentenceStartDates.B0037AA),
      fixture.calculateReviewDate(sentenceStartDates.B0038AA)
    ]

    statuses == [
      'REJECTED BY\nSUPERVISOR',
      'Started (Api User)',
      'Awaiting approval',
      'Started (Api User)',
      'Awaiting approval',
      'Approved',
      'Not categorised',
      'Started (Api User)',
      'Awaiting approval',
      'Approved'
    ]

    startButtons*.text() == ['Edit', 'Edit', 'PNOMIS', 'PNOMIS', 'View', 'PNOMIS', 'Start', 'Edit', 'PNOMIS', 'PNOMIS']

    poms[0] == 'Engelbert Humperdinck'
  }

  def "The home page for a supervisor is present"() {
    // Only some of the prisoners are in the DB
    // Refer to table in https://dsdmoj.atlassian.net/browse/CAT-254
    db.createDataWithStatus(-2, 32, 'STARTED', '{}')
    db.createDataWithStatus(-3, 33, 'AWAITING_APPROVAL', '{}')
    db.createDataWithStatus(-4, 34, 'APPROVED', '{}')
    db.createDataWithIdAndStatusAndCatType(-6, 36, 'AWAITING_APPROVAL', '{}', 'RECAT')
    db.createNomisSeqNo(33, 3)
    db.createNomisSeqNo(36, 6)

    when: 'I go to the home page as supervisor'

    def sentenceStartDate31 = LocalDate.of(2019, 2, 8)
    def sentenceStartDate32 = LocalDate.of(2019, 2, 4)
    def sentenceStartDate33 = LocalDate.of(2019, 1, 31)
    def sentenceStartDate34 = LocalDate.of(2019, 1, 28)
    def daysSinceSentence31 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate31, TODAY))
    def daysSinceSentence32 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate32, TODAY))
    def daysSinceSentence33 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate33, TODAY))
    def daysSinceSentence34 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate34, TODAY))
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedForSupervisorFull()
    prisonerSearchApi.stubSentenceData(['B0031AA', 'B0032AA', 'B0033AA', 'B0034AA'], [31, 32, 33, 34],
      [sentenceStartDate31.toString(), sentenceStartDate32.toString(), sentenceStartDate33.toString(), sentenceStartDate34.toString()])

    fixture.loginAs(SUPERVISOR_USER)

    then: 'The supervisor home page is displayed'
    at SupervisorHomePage
    names == ['Recat, Mr\nB0036AA','Approved, Awaiting\nB0034AA', 'Awaiting, Awaiting\nB0033AA', 'Started, Awaiting\nB0032AA', 'Missing, Awaiting\nB0031AA']
    days == ['', daysSinceSentence34, daysSinceSentence33, daysSinceSentence32, daysSinceSentence31]
    dates == ['', '11/02/2019', '14/02/2019', '18/02/2019', '22/02/2019']
    nextReviewDate == ['01/02/2019', '', '','', '15/01/2019']
    catBy == ['Roger Rabbit', 'Bugs Bunny', 'Roger Rabbit', 'Bugs Bunny', 'Roger Rabbit']
    statuses == ['B', 'C', 'B', 'C', 'B']
    catTypes == ['Recat', 'Initial', 'Initial', 'Initial', '']
    startButtons*.text() == ['Start', 'PNOMIS', 'Start', 'PNOMIS', 'PNOMIS']
    !multipleRoleDiv.isDisplayed()
  }

  def "The home page for a recategoriser is present"() {
    when: 'I go to the home page as recategoriser'

    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])

    fixture.loginAs(RECATEGORISER_USER)

    then: 'The recategoriser home page is displayed'
    at RecategoriserHomePage
    names == ['Pitstop, Penelope B2345XY', 'Tim, Tiny C0001AA', 'Hillmob, Ant B2345YZ', 'Mole, Adrian C0002AA']
    dates == ['4 days\noverdue', '3 days\noverdue', '2 days\noverdue', TODAY.plusDays(17).format('dd/MM/yyyy')]
    reasons == ['Review due', 'Age 21', 'Review due', 'Age 21']
    statuses == ['Not started', 'Not started', 'Not started', 'Not started']
    poms == ['Engelbert Humperdinck', 'Engelbert Humperdinck', 'Engelbert Humperdinck', 'Engelbert Humperdinck']
    startButtons[0].text() == 'Start'
    startButtons[0].@href.contains('/tasklistRecat/12?reason=DUE')
    checkTabLink.isDisplayed()
  }

  def "The home page for a multiple role user is present"() {

    db.createDataWithStatus(11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]]
    ]))
    when: 'I go to the home page as multi-role user (categoriser and supervisor)'

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(MULTIROLE_USER)

    then: 'The supervisor home page is displayed as it has precedence over the categoriser home page'
    at SupervisorHomePage
    elite2Api.stubUncategorised()
    multipleRoleDiv.isDisplayed()
    roleSwitchSelect.find('option', value: 'supervisor').text() == 'Supervisor'
    roleSwitchSelect.find('option', value: 'categoriser').text() == 'Categoriser'

    when: 'I select categoriser from the Current role select box'
    roleSwitchSelect = "categoriser"

    then: 'The categoriser home page is displayed'
    at CategoriserHomePage

    when: 'I select supervisor from the Current role select box'
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    roleSwitchSelect = "supervisor"

    then: 'The new role - supervisor home page is displayed'
    at SupervisorHomePage
  }


  def "The status of 'Started' for an offender is calculated correctly"() {
    when: 'A user starts a categorisation'

    elite2Api.stubUncategorisedNoStatus(678)
    prisonerSearchApi.stubSentenceData(['ON678'], [678], [TODAY.plusDays(-3).toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(678, "ON678")
    riskProfilerApi.stubForTasklists('ON678', 'C', false)
    pathfinderApi.stubGetExtremismProfile('ON678', 1)
    selectFirstPrisoner() // selects B2345YZ
    at(new TasklistPage(bookingId: '678'))
    headerValue*.text() == ['ON678', '17/02/1970', 'C-04-02', 'Coventry', 'A Felony', 'Another Felony', 'Latvian', '02/02/2020']
    elite2Api.stubAssessments(['ON678'])
    elite2Api.stubSentenceDataGetSingle('ON678', '2014-11-23')
    elite2Api.stubOffenceHistory('ON678')
    offendingHistoryButton.click()
    at(new CategoriserOffendingHistoryPage(bookingId: '12'))
    previousConvictionsNo.click()
    saveButton.click()
    at(new TasklistPage(bookingId: '12'))

    then: 'The uncategorised list is displayed with correct status text'

    categorisationHomeLink.click()
    at CategoriserHomePage
    statuses == ['Started (Api User)']

    when: 'A second user views the uncategorised list'

    fixture.logout()

    oauthApi.resetAll()
    // call to retrieve another users's details for assigned user name
    elite2Api.stubGetUserDetails(CATEGORISER_USER, Caseload.LEI.id)
    fixture.loginAs(ITAG_USER_COLLEAGUE)
    at CategoriserHomePage

    then: 'The uncategorised list is displayed with the assigned user text'
    statuses == ["Started (Hpa User)"]
    startButtons[0].text() == 'Edit'
  }

  def "An offender Awaiting approval can be viewed and cancelled"() {

    db.createDataWithStatus(11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      ratings    : [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"],
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "B", categoryAppropriate: "No", overriddenCategoryText: "over ridden category text"]]
    ]))

    when: 'A user starts a categorisation'

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)

    // 14 days after sentenceStartDate
    elite2Api.stubUncategorised()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage

    elite2Api.stubGetOffenderDetails(11, "ON678")
    startButtons[0].click()
    then: 'The view page is displayed'
    at CategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'B\nWarning\nCategory for approval is Category B'

    when: 'The categorisation is cancelled'
    cancelLink.click()
    at CancelPage
    confirmNo.click()
    submitButton.click()
    at CategoriserAwaitingApprovalViewPage
    cancelLink.click()
    at CancelPage
    elite2Api.stubSetInactive(11, 'PENDING')
    confirmYes.click()
    submitButton.click()

    then: 'the cancel confirmed page is shown with finish and manage links'
    at CancelConfirmedPage
    finishButton.displayed
    manageLink.displayed

    when: 'the user returns to the todo list'
    elite2Api.stubUncategorised(['UNCATEGORISED','UNCATEGORISED'])
    finishButton.click()

    then: 'The cancelled record is available to initial categorisation'
    at CategoriserHomePage
    statuses == ['Not categorised', 'Not categorised']
    startButtons*.text() == ['Start', 'Start']
  }

  def "An offender RECAT Awaiting approval can be viewed and cancelled"() {

    db.createDataWithStatusAndCatType(11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      recat    : TestFixture.defaultRecat,
    ]), 'RECAT', 'B2345XY')
    db.createNomisSeqNo(11,5)
    db.createReviewReason(11, 'DUE')

    when: 'A recategorisation user logs in'

    elite2Api.stubRecategorise(['A','P','A','A'])
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345XY')
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage
    elite2Api.stubAgencyDetails('LPI') // existing assessments
    elite2Api.stubGetOffenderDetails(11, "B2345XY")
    waitFor {
      startButtons[2].click()
    }

    then: 'The view page is displayed'
    at RecategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'C\nWarning\nCategory for approval is C'

    when: 'The categorisation is cancelled'
    cancelLink.click()
    at CancelPage
    confirmNo.click()
    submitButton.click()
    at RecategoriserAwaitingApprovalViewPage
    cancelLink.click()
    at CancelPage
    elite2Api.stubSetInactive(11, 'PENDING')
    confirmYes.click()
    submitButton.click()

    then: 'the cancel confirmed page is shown with finish and manage links'
    at CancelConfirmedPage
    finishButton.displayed
    manageLink.displayed

    and: 'the status is cancelled in the database'
    def data = db.getData(11)[0]
    data.status == "CANCELLED"
    data.cancelled_date != null
    data.cancelled_by == 'RECATEGORISER_USER'

    when: 'the user returns to the todo list'
    elite2Api.stubRecategorise(['A','A','A','A'])
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    finishButton.click()

    then: 'The cancelled record is available to recategorise'
    at RecategoriserHomePage
    statuses == ['Not started', 'Not started', 'Not started', 'Not started']
    startButtons*.text() == ['Start', 'Start', 'Start', 'Start']
  }


  def "An offender RECAT Awaiting approval can be cancelled without affecting the visibility of a previously approved categorisation"() {

    db.createDataWithIdAndStatusAndCatType(3, 11, 'APPROVED', JsonOutput.toJson([
      ratings: fixture.defaultRatingsC ]), 'RECAT', 'B2345XY')

    db.createNomisSeqNo(11,6, 1)
    db.createReviewReason(11, 'DUE')

    db.createDataWithIdAndStatusAndCatTypeAndSeq(4,11, 'AWAITING_APPROVAL', JsonOutput.toJson([
      recat    : TestFixture.defaultRecat,
    ]), 'RECAT', 'B2345XY', 2)

    db.createNomisSeqNo(11,7, 2)
    db.createReviewReason(11, 'DUE')


    when: 'A recategorisation user logs in'

    elite2Api.stubRecategorise(['A','P','A','A'])
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345XY')
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage

    elite2Api.stubAgencyDetails('LPI') // existing assessments
    elite2Api.stubGetOffenderDetails(11, "B2345XY")
    waitFor {
      startButtons[2].click()
    }

    then: 'The view page is displayed'
    at RecategoriserAwaitingApprovalViewPage

    when: 'The categorisation is cancelled'
    cancelLink.click()
    at CancelPage
    elite2Api.stubSetInactive(11, 'PENDING')
    confirmYes.click()
    submitButton.click()
    at CancelConfirmedPage
    elite2Api.stubRecategorise(['A','A','A','A'])
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    finishButton.click()
    at RecategoriserHomePage

    elite2Api.stubCategorised([11])
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()

    then: 'The recategoriser done page is displayed, showing the completed categorisation (prior to the cancellation)'
    at RecategoriserDonePage
  }

  def "Log out"() {
    given: "I have logged in"
    def sentenceStartDate = TODAY.plusDays(-3).toString()
    elite2Api.stubUncategorised()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate.toString(), sentenceStartDate.toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage

    when: "I log out"
    fixture.logout()

    then: "I am taken back to the Login page."
    $('h1').text() == 'Sign in'
  }

  def "Deep urls work"() {
    when: "I try to go direct to the categoriser Done page"
    fixture.stubLogin(CATEGORISER_USER)
    go 'categoriserDone'

    then: "the login page is shown"
    waitFor { $('h1').text() == 'Sign in' }

    when: "I login"
    elite2Api.stubCategorised([])
    fixture.simulateLogin()

    then: "I arrive at the originally specified page"
    at CategoriserDonePage
  }
}
