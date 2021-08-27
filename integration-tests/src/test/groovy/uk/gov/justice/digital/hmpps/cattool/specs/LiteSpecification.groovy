package uk.gov.justice.digital.hmpps.cattool.specs

import uk.gov.justice.digital.hmpps.cattool.pages.*

import java.time.LocalDate
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class LiteSpecification extends AbstractSpecification {

  def setup() {
    elite2Api.stubAgencyDetails('LPI')
    elite2Api.stubAssessments('B2345YZ')
  }

  def "A categoriser user can create an assessment and a supervisor approve it"() {

    given: 'a categoriser user is logged in'
    elite2Api.stubUncategorised()
    def now = LocalDate.now()
    def SIX_MONTHS_TIME = now.plus(6, ChronoUnit.MONTHS)

    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [now.toString(), now.toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'the user arrives at the landing page and clicks the link to check previous reviews'
    elite2Api.stubGetOffenderDetails(12)
    go '/12'
    at LandingPage
    elite2Api.stubAgenciesPrison()
    liteCategoriesButton.click()

    then: 'The assessment page is displayed correctly'
    at LiteCategoriesPage
    // check default
    form.nextReviewDate == SIX_MONTHS_TIME.format('dd/MM/yyyy')

    when: 'Re-assessment is omitted'
    form.nextReviewDate = ''
    form.category = 'T'
    form.authority = 'GOV'
    form.placement = 'BXI'
    form.comment = 'comment text'
    saveButton.click()

    then: 'A validation error occurs but other fields are preserved'
    at LiteCategoriesPage
    errorSummaries*.text() == ['Enter a valid date that is after today']
    errors*.text() == ['Error:\nEnter a valid date that is after today']
    form.category == 'T'
    form.authority == 'GOV'
    form.placement == 'BXI'
    form.comment == 'comment text'

    when: 'Re-assessment is set to a past date'
    form.nextReviewDate = '21/11/2019'
    saveButton.click()

    then: 'A validation error occurs'
    at LiteCategoriesPage
    errorSummaries*.text() == ['Enter a valid date that is after today']
    errors*.text() == ['Error:\nEnter a valid date that is after today']

    when: 'Re-assessment is set to an invalid date'
    form.nextReviewDate = 'INVALID'
    saveButton.click()

    then: 'A validation error occurs'
    at LiteCategoriesPage
    errorSummaries*.text() == ['Enter a valid date that is after today']
    errors*.text() == ['Error:\nEnter a valid date that is after today']

    when: 'details are entered'
    go 'liteCategories/12' // reset the nextReviewDate
    form.category = 'V'
    form.authority = 'RECP'
    form.placement = 'BXI'
    form.comment = 'comment'
    elite2Api.stubCategorise([bookingId        : 12,
                              category         : 'V',
                              committee        : 'RECP',
                              nextReviewDate   : SIX_MONTHS_TIME.format('yyyy-MM-dd'),
                              comment          : "comment",
                              placementAgencyId: "BXI"
    ], 1)

    saveButton.click()

    then: 'The confirmed page is shown and details are in the database'
    at LiteCategoriesConfirmedPage
    def data = db.getLiteData(12)[0]
    data.sequence == 1
    data.category == 'V'
    data.offender_no == 'B2345YZ'
    data.prison_id == 'LEI'
    data.created_date.toLocalDate().equals(now)
    data.assessed_by == 'CATEGORISER_USER'
    data.assessment_committee == 'RECP'
    data.next_review_date.toLocalDate().equals(SIX_MONTHS_TIME)
    data.assessment_comment == 'comment'
    data.placement_prison_id == 'BXI'

    when: 'A categoriser returns to the assessment page for the same offender'
    go '/12'
    at LandingPage
    liteCategoriesButton.click()

    then: 'A warning is shown'
    at LiteCategoriesPage
    warning.text() contains 'A categorisation is already in progress for this person'

    when: 'I go to the recat tasklist page'
    fixture.logout()
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    // not in to-do list so have to go directly
    go '/tasklistRecat/12'

    then: 'The correct error is shown'
    at ErrorPage
    errorSummaryTitle.text() == 'Error: This prisoner has an unapproved categorisation in the "Other categories" section'

    when: 'I go to the initial todo list'
    fixture.logout()
    fixture.loginAs(CATEGORISER_USER)

    then: 'OTHER is shown rather than PNOMIS'
    browser.at CategoriserHomePage
    startButtons[0].text() == 'OTHER'

    when: 'I go to the initial tasklist page'
    go '/tasklist/12' // no clickable button available, so force to page

    then: 'The correct error is shown'
    at ErrorPage
    errorSummaryTitle.text() == 'Error: This prisoner has an unapproved categorisation in the "Other categories" section'

    ///////////////////////////////////////////////////////////////////////////////////////

    when: 'A supervisor views their lite todo page'
    fixture.logout()
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY'], [11], [now.toString()])
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    elite2Api.stubGetStaffDetailsByUsernameList()
    liteCategoriesTab.click()
    at SupervisorLiteListPage

    then: 'this categorisation is listed'
    assessmentDates[0] == now.format('dd/MM/yyyy')
    names[0] == 'Dent, Jane'
    prisonNos[0] == 'B2345YZ'
    categorisers[0] == 'Firstname_categoriser_user Lastname_categoriser_user'
    categories[0] == 'V'

    when: 'a categorisation approval is attempted with a future approval Date and past nextReviewDate'
    elite2Api.stubGetUserDetails(CATEGORISER_USER, 'SYI')
    approveButtons[0].click()
    at LiteApprovalPage
    // check defaults
    form.approvedDate == now.format('dd/MM/yyyy')
    form.nextReviewDate == SIX_MONTHS_TIME.format('dd/MM/yyyy')

    form.approvedDate = SIX_MONTHS_TIME.format('dd/MM/yyyy')
    form.nextReviewDate = '21/11/2019'
    saveButton.click()

    then: 'A validation error occurs'
    at LiteApprovalPage
    errorSummaries*.text() == ['Enter a valid date that is after today', 'Enter a valid date that is today or earlier']
    errors*.text() == ['Error:\nEnter a valid date', 'Error:\nEnter a valid future date']

    when: 'Date are set to an invalid date'
    form.approvedDate = '300/02/2020'
    form.nextReviewDate = '4/5'
    saveButton.click()

    then: 'A validation error occurs'
    at LiteApprovalPage
    errorSummaries*.text() == ['Enter a valid date that is after today', 'Enter a valid date that is today or earlier']
    errors*.text() == ['Error:\nEnter a valid date', 'Error:\nEnter a valid future date']

    when: 'details are entered'
    form.approvedDate = '29/04/2020'
    form.supervisorCategory = 'T'
    form.approvedCategoryComment = 'approvedCategoryComment'
    form.approvedCommittee = 'GOV'
    form.approvedPlacement = 'SYI'
    form.approvedPlacementComment = 'approvedPlacementComment'
    form.nextReviewDate = now.plusMonths(12).format('dd/MM/yyyy')
    form.approvedComment = 'approvedComment'
    elite2Api.stubSupervisorApprove([category                 : 'T',
                                     "approvedCategoryComment": "approvedCategoryComment",
                                     bookingId                : 12,
                                     "assessmentSeq"          : 1,
                                     reviewCommitteeCode      : 'GOV',
                                     nextReviewDate           : now.plusMonths(12).format('yyyy-MM-dd'),
                                     committeeCommentText     : "approvedComment",
                                     approvedPlacementText    : "approvedPlacementComment",
                                     approvedPlacementAgencyId: 'SYI',
                                     "evaluationDate"         : '2020-04-29',
    ])
    saveButton.click()

    then: 'The confirmed page is shown and details are in the database'
    at LiteCategoriesConfirmedPage
    def data2 = db.getLiteData(12)[0]
    data2.supervisor_category == 'T'
    data2.approved_date.toLocalDate().equals(LocalDate.of(2020, 4, 29))
    data2.approved_by == 'SUPERVISOR_USER'
    data2.approved_committee == 'GOV'
    data2.next_review_date.toLocalDate().equals(now.plusMonths(12))
    data2.approved_placement_prison_id == 'SYI'
    data2.approved_placement_comment == 'approvedPlacementComment'
    data2.approved_comment == 'approvedComment'
  }

  def "An assessment is removed if already approved on Nomis"() {
    def now = LocalDate.now()
    elite2Api.stubSentenceData(['B2345YZ'], [11], [now.toString(), now.toString()])
    elite2Api.stubGetUserDetails(CATEGORISER_USER, 'SYI')
    elite2Api.stubGetStaffDetailsByUsernameList()
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    elite2Api.stubGetOffenderDetails(12)
    elite2Api.stubAgenciesPrison()
    elite2Api.stubUncategorised()

    given: 'there is an assessment waiting for approval'
    db.createUnapprovedLiteCategorisation(12,1,'B2345YZ','V', 'LEI', 'CATEGORISER_USER')
    assert db.getLiteData(12).size() == 1

    and: 'a supervisor user is logged in'
    fixture.loginAs(SUPERVISOR_USER)

    when: 'a supervisor approves the assessment'
    go '/liteCategories/approveList'
    at SupervisorLiteListPage
    approveButtons[0].click()
    at LiteApprovalPage
    form.nextReviewDate = now.plusMonths(12).format('dd/MM/yyyy')

    and: 'an error is received from nomis stating that the assessment is not found'
    elite2Api.stubSupervisorApproveNoPendingAssessmentError([
      "bookingId" : 12,
      "assessmentSeq" : 1,
      "category" : "V",
      "approvedCategoryComment" : "",
      "reviewCommitteeCode" : "OCA",
      "nextReviewDate" : now.plusMonths(12).format('yyyy-MM-dd'),
      "approvedPlacementAgencyId" : "",
      "approvedPlacementText" : "",
      "evaluationDate" : now.format('yyyy-MM-dd'),
      "committeeCommentText" : ""
    ])
    saveButton.click()

    then: 'the already approved page is shown'
    at LiteCategoriesAlreadyApprovedPage

    and: 'the lite categorisation is removed from the database'
    assert db.getLiteData(12).isEmpty()
  }
}
