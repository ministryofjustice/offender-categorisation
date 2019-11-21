package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonSlurper
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ApprovedViewRecatPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class LandingPageSpecification extends GebReportingSpec {

  def today = LocalDate.now().format('dd/MM/yyyy')

  def setup() {
    db.clearDb()
  }

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "A recategoriser user can start a recat from the landing page"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12)
    go '/12'

    then: 'The page contains a recat button'
    at LandingPage
    recatButton.displayed

    when: 'It is clicked'
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    elite2Api.stubUpdateNextReviewDate(LocalDate.now().plusDays(fixture.get10BusinessDays()).format('yyyy-MM-dd'))
    recatButton.click()

    then: 'We are sent to the recat tasklist'
    at TasklistRecatPage
    currentUrl.contains '/tasklistRecat/12'
    def data = db.getData(12)
    data.status == ["STARTED"]
    data.review_reason.value == ["MANUAL"]
  }

  def "A recategoriser user sees a warning for initial cat"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'U')
    go '/12'

    then: 'The page contains an initial cat warning'
    at LandingPage
    !recatButton.displayed
    warning.text() contains 'This prisoner seems to need an INITIAL category'
  }

  def "A recategoriser user sees a warning for cat A"() {

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'A')
    go '/12'

    then: 'The page contains a warning'
    at LandingPage
    !recatButton.displayed
    warning.text() contains 'This prisoner is Cat A. They cannot be categorised here.'
  }

  def "A recategoriser user sees a continue button when a recat is in progress"() {

    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT', 'B2345YZ')

    given: 'A recategoriser is logged in'
    elite2Api.stubRecategorise()
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
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
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

  def "A security user can flag a prisoner for later referral"() {

    given: 'A security user is logged in'
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    elite2Api.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    elite2Api.stubUncategorised()
    elite2Api.stubGetUserDetails(SECURITY_USER, 'LEI')
    elite2Api.stubGetSecurityStaffDetailsByUsernameList()
    fixture.loginAs(SECURITY_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12)
    go '/12'

    then: 'The page contains a security referral button'
    at LandingPage
    securityButton.displayed

    when: 'It is clicked'
    securityButton.click()

    then: 'The referral is stored'
    at SecurityReferralSubmittedPage
    def securityNew = db.getSecurityData('B2345YZ')[0]
    securityNew.offender_no == 'B2345YZ'
    securityNew.status.value == 'NEW'
    securityNew.prison_id == 'LEI'
    securityNew.user_id == SECURITY_USER.getUsername()
    System.currentTimeMillis() - securityNew.raised_date.getTime() < 10000

    when: 'The security user revisits the page'
    go '/12'
    at LandingPage

    then: 'A message is shown instead of a button'
    driver.pageSource =~ /This person will automatically be referred to security at next category review/
    driver.pageSource.contains('Referred by Another User of LEEDS (HMP) on ' +  LocalDate.now().format('dd/MM/yyyy'))

    when: 'A re-categoriser starts a recat'
    fixture.logout()
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    go '/12'
    at LandingPage
    elite2Api.stubUpdateNextReviewDate(LocalDate.now().plusDays(fixture.get10BusinessDays()).format('yyyy-MM-dd'))
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    recatButton.click()

    then: 'Security is locked'
    at TasklistRecatPage
    securityButton.@disabled
    $('#securitySection').text().contains("Flagged to be referred to Security ($today)")

    and: 'the security database table is updated correctly'
    def securityReferred = db.getSecurityData('B2345YZ')[0]
    securityReferred.status.value == 'REFERRED'
    System.currentTimeMillis() - securityReferred.processed_date.getTime() < 10000

    when: 'the security user reviews the prisoner'
    fixture.logout()
    fixture.loginAs(SECURITY_USER)
    at SecurityHomePage
    startButtons[0].text() == 'Start'
    startButtons[0].click()

    then: 'the security review page displays the referral details'
    at new SecurityReviewPage(bookingId: '12')
    driver.pageSource.contains('This individual was identified as needing a security review, as part of their categorisation, by Another User of LEEDS (HMP) on ' +  LocalDate.now().format('dd/MM/yyyy'))

    when: 'the security review page is only saved'
    securityText << 'security info'
    saveOnlyButton.click()

    then: 'the button has changed and the form database table is updated correctly'
    at SecurityHomePage
    startButtons[0].text() == 'Edit'
    def data = db.getData(12)[0]
    def response = new JsonSlurper().parseText(data.form_response.toString())
    response.security.review.securityReview == 'security info'
    data.status == 'SECURITY_FLAGGED'
    data.cat_type.value == 'RECAT'
    data.referred_by == 'SECURITY_USER'
    data.security_reviewed_by == null

    when: 'the security review page is submitted'
    startButtons[0].click()
    at SecurityReviewPage
    securityText << ', more security info'
    submitButton.click()

    then: 'the prisoner is no longer on the list and the form database table is updated correctly'
    at SecurityHomePage
    bodyRows.size() == 0
    def data2 = db.getData(12)[0]
    def response2 = new JsonSlurper().parseText(data2.form_response.toString())
    response2.security.review.securityReview == 'security info, more security info'
    data2.status == 'SECURITY_BACK'
    data2.security_reviewed_by == 'SECURITY_USER'
  }

  def "A prisoner is both flagged and automatically referred"() {

    given: 'A security user logs in'
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    elite2Api.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    elite2Api.stubUncategorised()
    elite2Api.stubGetUserDetails(SECURITY_USER, 'LEI')
    elite2Api.stubGetSecurityStaffDetailsByUsernameList()
    fixture.loginAs(SECURITY_USER)

    and: 'Refers a prisoner'
    elite2Api.stubGetOffenderDetails(12)
    go '/12'
    at LandingPage
    securityButton.click()
    at SecurityReferralSubmittedPage

    when: 'A re-categoriser starts a recat which is automatically referred'
    fixture.logout()
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    go '/12'
    at LandingPage
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', true)
    elite2Api.stubUpdateNextReviewDate(LocalDate.now().plusDays(fixture.get10BusinessDays()).format('yyyy-MM-dd'))
    recatButton.click()

    then: 'Security is locked due to being flagged'
    at TasklistRecatPage
    securityButton.@disabled
    $('#securitySection').text().contains("Flagged to be referred to Security ($today)")

    and: 'the database is updated correctly'
    def securityReferred = db.getSecurityData('B2345YZ')[0]
    securityReferred.status.value == 'REFERRED'
    def data = db.getData(12)[0]
    data.status == 'SECURITY_FLAGGED'
    data.cat_type.value == 'RECAT'
    data.referred_by == 'SECURITY_USER'
  }

  def "A basic user can view previous categorisations if prisoner is in their prison"() {
    db.createData(12, '{}') // should get ignored
    // category history is driven by the nomis response, a link to view the record is provided if a postgres record exists -  matched on nomis sequence
    db.doCreateCompleteRow(-2, 12, '{}', 'CATEGORISER_USER', 'APPROVED', 'INITIAL', null, null, null,
      2, '{}', 'LEI', 'B2345YZ', 'current_timestamp(2)', null, null, '2019-07-29')
    db.doCreateCompleteRow(-3, 12, '{}', 'RECATEGORISER_USER', 'APPROVED', 'RECAT', null, null, null,
      3, '{}', 'BXI', 'B2345YZ', 'current_timestamp(2)', null, null, '2019-08-05')
    db.doCreateCompleteRow(-4, 12,'{}',
      'RECATEGORISER_USER', 'APPROVED', 'RECAT', null, null, null,
      4, '{}', 'LPI', 'B2345YZ', 'current_timestamp(2)', null, null, '2019-08-29')

    db.createNomisSeqNoWhenMultipleCatgorisationsForOffender(12, 2, 1)
    db.createNomisSeqNoWhenMultipleCatgorisationsForOffender(12, 3, 3)
    db.createNomisSeqNoWhenMultipleCatgorisationsForOffender(12, 4, 4)
    given: 'a basic user is logged in'
    fixture.loginAs(READONLY_USER)

    when: 'the user arrives at the landing page and clicks the link to check previous reviews'
    elite2Api.stubGetOffenderDetails(12)
    elite2Api.stubGetBasicOffenderDetails(12)
    go '/12'
    at LandingPage
    elite2Api.stubAssessmentsWithCurrent("B2345YZ", 12)
    elite2Api.stubAgencyDetails('LPI')
    historyButton.click()

    then: 'The previous category reviews page is displayed correctly'
    at CategoryHistoryPage
    rows[0].find('td')*.text() == ['28/03/2019', 'U', 'LPI prison', '']  // no local record means no view link provided
    rows[1].find('td')*.text() == ['04/04/2018', 'P', 'LPI prison', 'View (opens in new tab)']
    rows[2].find('td')*.text() == ['24/03/2013', 'B', 'LPI prison', 'View (opens in new tab)']
    rows[3].find('td')*.text() == ['04/04/2012', 'A', 'LPI prison', 'View (opens in new tab)']
    rows[1].find('td > a').@href.contains '/form/approvedView/12?sequenceNo=4'

    when: 'the user selects a review'
    elite2Api.stubAgencyDetails('BXI')
    elite2Api.stubAgencyDetails('LEI')
    elite2Api.stubAssessments(['B2345YZ'])

    then: 'the approved view page is shown'
    withNewWindow({ rows[2].find('td > a').click() }) {
      at ApprovedViewRecatPage
    }
  }

  def "A categoriser user can start an initial cat from the landing page"() {

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page'
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'U')
    go '/12'

    then: 'The page contains an initial cat button'
    at LandingPage
    initialButton.displayed
    initialButton.@href.contains('/tasklist/12?reason=MANUAL')
    !warning.displayed

    when: 'It is clicked'
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    elite2Api.stubSetInactive(12, 'ACTIVE')
    initialButton.click()

    then: 'We are sent to the tasklist and data is stored'
    at TasklistPage
    currentUrl.contains '/tasklist/12?reason=MANUAL'
    def data = db.getData(12)
    data.status == ["STARTED"]
    data.cat_type.value == ["INITIAL"]
    data.review_reason.value == ["MANUAL"]
    elite2Api.verifySetInactive() == null
  }

  def "A categoriser user can start an initial cat where a cat already exists"() {

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)

    when: 'The user arrives at the landing page and a cat already exists'
    elite2Api.stubGetOffenderDetails(12,'B2345YZ',  false,  false, 'B')
    go '/12'

    then: 'The page contains an initial cat button and a warning'
    at LandingPage
    !recatButton.displayed
    initialButton.displayed
    warning.text() endsWith 'This prisoner already has a category of Cat B.'

    when: 'It is clicked'
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    elite2Api.stubSetInactive(12, 'ACTIVE')
    initialButton.click()

    then: 'We are sent to the tasklist and data is stored'
    at TasklistPage
    currentUrl.contains '/tasklist/12?reason=MANUAL'
    def data = db.getData(12)
    data.status == ["STARTED"]
    data.cat_type.value == ["INITIAL"]
    data.review_reason.value == ["MANUAL"]
    elite2Api.verifySetInactive() == null
  }

  def "A categoriser user sees a continue button when an initial cat is in progress"() {

    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'INITIAL', 'B2345YZ')

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
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
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
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
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
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

  def "A categoriser user sees a warning for awaiting approval"() {

    db.createDataWithStatusAndCatType(12, 'AWAITING_APPROVAL', '{}', 'INITIAL', 'B2345YZ')

    given: 'A categoriser is logged in'
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
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

  def "A supervisor user sees a prisoner with no cat data"() {

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345XY')
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C')
    go '/12'

    then: 'they are treated as no cat in progress'
    at LandingPage
    paragraphs*.text() contains 'They are due to be reviewed by Thursday 16th January 2020.'
  }

  def "A supervisor user sees a prisoner awaiting approval"() {
    db.createDataWithStatusAndCatType(12, 'AWAITING_APPROVAL', '{}', 'INITIAL', 'B2345YZ')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345XY')
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C')
    go '/12'

    then: 'they are given a start button'
    at LandingPage
    approveButton.displayed
  }

  def "A supervisor user sees a started initial cat"() {
    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'INITIAL', 'B2345YZ')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345XY')
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C')
    go '/12'

    then: 'they are informed there is a cat in progress'
    at LandingPage
    paragraphs*.text() contains 'This prisoner\'s initial categorisation is in progress.'
  }

  def "A supervisor user sees a started recat"() {
    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT', 'B2345YZ')

    when: 'The supervisor visits the landing page'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY'], [11], [LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345XY')
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
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    elite2Api.stubAssessments('B2345XY')
    fixture.loginAs(SUPERVISOR_USER)
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ',  false,  false, 'C')
    go '/12'

    then: 'they are treated as no cat in progress'
    at LandingPage
    paragraphs*.text() contains 'They are due to be reviewed by Thursday 16th January 2020.'
  }
}
