package uk.gov.justice.digital.hmpps.cattool.specs

import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ApprovedViewRecatPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class LandingPageSpecification extends AbstractSpecification {

  def today = LocalDate.now().format('dd/MM/yyyy')

  def setup() {
    elite2Api.stubAgencyDetails('LPI')
  }

   def "A recategoriser user can start a recat from the landing page"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12)
    go '/12'

    then: 'The page contains a recat button and a next review button'
    at LandingPage
    recatButton.displayed
    nextReviewDateButton.displayed

    when: 'It is clicked'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubUpdateNextReviewDate(LocalDate.now().plusDays(fixture.get10BusinessDays()).format('yyyy-MM-dd'))
    recatButton.click()

    then: 'We are sent to the recat tasklist'
    at TasklistRecatPage
    currentUrl.contains '/tasklistRecat/12'
    def data = db.getData(12)
    data.status == ["STARTED"]
    data.review_reason == ["MANUAL"]
  }

  def "A recategoriser user sees a warning for initial cat"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'U')
    go '/12'

    then: 'The page contains an initial cat warning'
    at LandingPage
    !recatButton.displayed
    warning.text() contains 'This prisoner seems to need an INITIAL category'
  }

  def "A recategoriser user can proceed with a cat when prisoner is cat U but has previous cats"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'U')
    elite2Api.stubAssessments('B2345YZ', false, 12)
    go '/12'

    then: 'The page contains the recat button and the next review button'
    at LandingPage
    recatButton.displayed
    nextReviewDateButton.displayed
  }

  def "A recategoriser user can proceed with a cat when prisoner is Women's Open category (T)"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'T')
    go '/12'

    then: 'The user can continue with the recategorisation'
    at LandingPage
    recatButton.displayed
    !warning.displayed
  }

  def "A recategoriser user can proceed with a cat when prisoner is Women's Closed category (R)"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'R')
    go '/12'

    then: 'The user can continue with the recategorisation'
    at LandingPage
    recatButton.displayed
    !warning.displayed
  }

  def "A recategoriser user sees a warning for cat A"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'A')
    go '/12'

    then: 'The page contains a warning'
    at LandingPage
    !recatButton.displayed
    warning.text() contains 'This prisoner is Cat A. They cannot be categorised here'
  }

  def "A recategoriser user sees a continue button when a recat is in progress"() {

    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT', 'B2345YZ')

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page for an already-started cat'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'C')
    go '/12'

    then: 'The page contains a recat continue button'
    at LandingPage
    editButton.displayed
    !recatButton.displayed
    !warning.displayed

    when: 'It is clicked'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubUpdateNextReviewDate(LocalDate.now().plusDays(fixture.get10BusinessDays()).format('yyyy-MM-dd'))
    editButton.click()

    then: 'We are sent to the recat tasklist'
    at TasklistRecatPage
    currentUrl.contains '/tasklistRecat/12'
  }

  def "A recategoriser user sees a warning for initial cat being in progress"() {

    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'INITIAL', 'B2345YZ')

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page for an already-started cat'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'C')
    go '/12'

    then: 'The page contains a warning'
    at LandingPage
    !recatButton.displayed
    !editButton.displayed
    warning.text() contains "This prisoner has an initial categorisation in progress"
  }

  def "A recategoriser user sees a warning for awaiting approval"() {

    db.createDataWithStatusAndCatType(12, 'AWAITING_APPROVAL', '{}', 'RECAT', 'B2345YZ')

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345YZ')
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page for a cat in awaiting approval status'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'C')
    go '/12'

    then: 'The page contains a warning'
    at LandingPage
    !recatButton.displayed
    warning.text() contains "This prisoner is awaiting supervisor approval"
    viewButton.displayed
  }

  def "A recategoriser user sees no next review button if there are no existing cats"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessmentsEmpty()
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'C', false, null)
    go '/12'

    then: 'The page does not contain a next review button'
    at LandingPage
    !nextReviewDateButton.displayed
  }

  def "A basic user can view previous categorisations and next review date if prisoner is in their prison"() {
    db.createData(12, '{}') // should get ignored
    // category history is driven by the nomis response, a link to view the record is provided if a postgres record exists -  matched on nomis sequence
    db.doCreateCompleteRow(-2, 12, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      2, '{}', 'LEI', 'B2345YZ', 'current_timestamp(2)', null, null, '2019-07-29')
    db.doCreateCompleteRow(-3, 12, '{}', 'RECATEGORISER_USER', 'APPROVED', 'RECAT', null, null, null,
      3, '{}', 'BXI', 'B2345YZ', 'current_timestamp(2)', null, null, '2019-08-05')
    db.doCreateCompleteRow(-4, 12,'{}',
      'RECATEGORISER_USER', 'APPROVED', 'RECAT', null, null, null,
      4, '{}', 'LPI', 'B2345YZ', 'current_timestamp(2)', null, null, '2019-08-29')

    db.createNomisSeqNoWhenMultipleCategorisationsForOffender(12, 3, 5)
    db.createNomisSeqNoWhenMultipleCategorisationsForOffender(12, 4, 4)
    given: 'a basic user is logged in'
    fixture.loginAs(READONLY_USER)

    when: 'the user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12)
    elite2Api.stubGetBasicOffenderDetails(12)
    go '/12'
    at LandingPage

    then: "next review date is shown correctly"
    nextReviewDate.text() == "They are due to be reviewed by Thursday 16 January 2020."

    when: "link is clicked to check previous reviews"
    elite2Api.stubAssessmentsWithCurrent("B2345YZ")
    elite2Api.stubAgencyDetails('LPI')
    historyButton.click()

    then: 'The previous category reviews page is displayed correctly'
    at CategoryHistoryPage
    rows[0].find('td')*.text() == ['18/06/2019', 'Unsentenced', 'LPI prison', 'View (opens in new tab)']
    rows[1].find('td')*.text() == ['08/06/2018', 'P', 'LPI prison', 'View (opens in new tab)']
    rows[2].find('td')*.text() == ['24/03/2013', 'B', 'LPI prison', ''] // no local record means no view link provided
    rows[3].find('td')*.text() == ['08/06/2012', 'A', 'LPI prison', '']
    rows[0].find('td > a').@href.contains '/form/approvedView/12?sequenceNo=3'

    when: 'the user selects a review'
    elite2Api.stubAgencyDetails('BXI')
    elite2Api.stubAgencyDetails('LEI')
    elite2Api.stubAssessments(['B2345YZ']) // incorrect param type?

    then: 'the approved view page is shown'
    withNewWindow({ rows[0].find('td > a').click() }) {
      at ApprovedViewRecatPage
    }
  }

  def "A categoriser user can start an initial cat from the landing page"() {

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'U', false, null)
    go '/12'

    then: 'The page contains an initial cat button but not a next review button'
    at LandingPage
    initialButton.displayed
    initialButton.@href.contains('/tasklist/12?reason=MANUAL')
    !warning.displayed
    !nextReviewDateButton.displayed

    when: 'It is clicked'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubSetInactive(12, 'ACTIVE')
    initialButton.click()

    then: 'We are sent to the tasklist and data is stored'
    at TasklistPage
    currentUrl.contains '/tasklist/12?reason=MANUAL'
    def data = db.getData(12)
    data.status == ["STARTED"]
    data.cat_type == ["INITIAL"]
    data.review_reason == ["MANUAL"]
  }

  def "A categoriser user can start an initial cat where a cat already exists"() {

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page and a cat already exists'
    elite2Api.stubGetOffenderDetails(12,'B2345YZ',  false,  false, 'B')
    go '/12'

    then: 'The page contains an initial cat button and a warning'
    at LandingPage
    !recatButton.displayed
    initialButton.displayed
    warning.text() endsWith 'This prisoner is already Cat B'

    when: 'It is clicked'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubSetInactive(12, 'ACTIVE')
    initialButton.click()

    then: 'We are sent to the tasklist and data is stored'
    at TasklistPage
    currentUrl.contains '/tasklist/12?reason=MANUAL'
    def data = db.getData(12)
    data.status == ["STARTED"]
    data.cat_type == ["INITIAL"]
    data.review_reason == ["MANUAL"]
  }

  def "A categoriser user sees a continue button when an initial cat is in progress"() {

    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'INITIAL', 'B2345YZ')

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page for an already-started cat'
    elite2Api.stubGetOffenderDetails(12,'B2345YZ',  false,  false, 'U')
    go '/12'

    then: 'The page contains a continue button'
    at LandingPage
    !initialButton.displayed
    editButton.displayed
    !warning.displayed

    when: 'It is clicked'
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubSetInactive(12, 'ACTIVE')
    editButton.click()

    then: 'We are sent to the tasklist'
    at TasklistPage
    currentUrl.contains '/tasklist/12'
  }

  def "A categoriser user sees a warning when a recat is in progress"() {

    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT', 'B2345YZ')

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page for an already-started cat'
    elite2Api.stubGetOffenderDetails(12,'B2345YZ',  false,  false, 'U')
    go '/12'

    then: 'The page contains a warning'
    at LandingPage
    !initialButton.displayed
    !editButton.displayed
    warning.text() contains "This prisoner has a categorisation review in progress"
  }

  def "A categoriser user can proceed with a cat when prisoner is Women's Open category (T)"() {
    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessments('B2345YZ')
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'T')
    go '/12'

    then: 'The user can continue with the categorisation'
    at LandingPage
    initialButton.displayed
    warning.text() contains "This prisoner is already Cat T"
  }

  def "A categoriser user can proceed with a cat when prisoner is Women's Closed category (R)"() {
    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessments('B2345YZ')
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'R')
    go '/12'

    then: 'The user can continue with the categorisation'
    at LandingPage
    initialButton.displayed
    warning.text() contains "This prisoner is already Cat R"
  }

  def "A categoriser user sees a warning for awaiting approval"() {

    db.createDataWithStatusAndCatType(12, 'AWAITING_APPROVAL', '{}', 'INITIAL', 'B2345YZ')

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page for an already-started cat'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'U')
    go '/12'

    then: 'The page contains a warning'
    at LandingPage
    !initialButton.displayed
    warning.text() contains "This prisoner is awaiting supervisor approval"
    viewButton.displayed
  }

  def "A categoriser user sees a next review button when a previous cat exists"() {

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubAssessments('B2345YZ')
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'U')
    go '/12'

    then: 'The page contains a next review button'
    at LandingPage
    nextReviewDateButton.displayed
  }

  def "A supervisor user sees a prisoner with no cat data"() {

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C', false, null)
    go '/12'

    then: 'they are treated as no cat in progress and no next review button is shown'
    at LandingPage
    !(paragraphs*.text().contains('This prisoner has a categorisation review in progress'))
    !nextReviewDateButton.displayed
  }

  def "A supervisor user sees a prisoner awaiting approval"() {
    db.createDataWithStatusAndCatType(12, 'AWAITING_APPROVAL', '{}', 'INITIAL', 'B2345YZ')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C', false, null)
    go '/12'

    then: 'they are given a start button'
    at LandingPage
    approveButton.displayed
  }

  def "A supervisor user sees a started initial cat"() {
    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'INITIAL', 'B2345YZ')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubAssessmentsEmpty()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'C', false, null)
    go '/12'

    then: 'they are informed there is a cat in progress'
    at LandingPage
    paragraphs*.text() contains 'This prisoner\'s initial categorisation is in progress.'
  }

  def "A supervisor user sees a started recat"() {
    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT', 'B2345YZ')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubAssessments('B2345YZ')
    prisonerSearchApi.stubSentenceData(['B2345XY'], [11], [LocalDate.now().toString()])
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C')
    go '/12'

    then: 'they are informed there is a cat in progress'
    at LandingPage
    paragraphs*.text() contains 'This prisoner has a categorisation review in progress.'
  }

  def "A supervisor user sees a prisoner with a cancelled cat"() {
    db.createDataWithStatusAndCatType(12, 'CANCELLED', '{}', 'INITIAL', 'B2345YZ')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubAssessments('B2345YZ')
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C')
    go '/12'

    then: 'they are treated as no cat in progress'
    at LandingPage
    paragraphs*.text() contains 'They are due to be reviewed by:'
    paragraphs*.text() contains 'Thursday 16 January 2020'
  }

  def "A supervisor user sees a next review button when there is an existing cat"() {
    db.createDataWithStatus(-4, 12, 'APPROVED', '{}')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubAssessments('B2345YZ')
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C')
    go '/12'

    then: ' a next review button is shown'
    at LandingPage
    nextReviewDateButton.displayed
  }
}
