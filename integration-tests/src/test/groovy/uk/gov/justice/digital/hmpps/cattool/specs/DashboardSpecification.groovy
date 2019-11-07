package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class DashboardSpecification extends GebReportingSpec {

  enum CatType {
    INITIAL, RECAT
  }

  enum SecurityType {
    MANUAL, AUTO, FLAGGED
  }

  class JasonBuilder {
    CatType catType
    String suggested
    String overridden
    String supervisor
    SecurityType securityType

    JasonBuilder securityType(securityType) {
      this.securityType = securityType
      return this
    }

    String build() {
      def sec = securityType == SecurityType.MANUAL ? [securityInputNeeded: 'Yes'] : null
      def contents
      if (catType == CatType.INITIAL) {
        contents = [categoriser: [provisionalCategory: [suggestedCategory: suggested, overriddenCategory: overridden]],
                    supervisor : [review: supervisor ? [supervisorOverriddenCategory: supervisor] : null],
                    ratings    : [securityInput: sec]]
      } else {
        contents = [recat     : [decision: [category: suggested], securityInput: sec],
                    supervisor: [review: supervisor ? [supervisorOverriddenCategory: supervisor] : null],
        ]
      }
      return JsonOutput.toJson(contents)
    }
  }

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

  static final SECURITY_AUTO = '{"socProfile":{"transferToSecurity":"true"}}'

  /** convenience method to make data setup calls as succinct as possible */
  def dbRow(bookingId, prisonId, catType, startDate, referredDate, securityReviewedDate, assessmentDate, approvalDate, dueByDate, json, riskProfile = '{}') {
    db.doCreateCompleteRow(-bookingId, bookingId, json, catType == 'INITIAL' ? 'CATEGORISER_USER' : 'RECATEGORISER_USER', 'APPROVED', catType, null, referredDate, null, 1, riskProfile,
      prisonId, "B00${bookingId}XY", startDate, null, securityReviewedDate, approvalDate, assessmentDate, dueByDate)
  }

  int dbCatRow(bookingId, seq, approvedDate, prisonId, suggested, supervisor = null) {
    return db.doCreateCompleteRow(-bookingId * seq, bookingId, rc(suggested, supervisor).build(), 'RECATEGORISER_USER', 'APPROVED', 'RECAT', null, null, null, seq, '{}',
      prisonId, "B00${bookingId}XY", "'2019-07-01T00:00Z'", null, null, approvedDate, '2019-07-22', '2019-08-03')
  }

  JasonBuilder ic(suggested, overridden = null, supervisor = null) {
    def b = new JasonBuilder(catType: CatType.INITIAL, suggested: suggested, overridden: overridden, supervisor: supervisor)
    return b
  }

  JasonBuilder rc(suggested, supervisor = null) {
    def b = new JasonBuilder(catType: CatType.RECAT, suggested: suggested, supervisor: supervisor)
    return b
  }

  def "The initial cat dashboard should show correct stats data"() {
    // ignored as AWAITING_APPROVAL or wrong cat type
    db.doCreateCompleteRow(-10, 10, ic('C').build(), 'CATEGORISER_USER', 'AWAITING_APPROVAL', 'INITIAL', null, null, null, 1, '{}',
      'LEI', "B0010XY", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    db.doCreateCompleteRow(-11, 11, rc('B').build(), 'RECATEGORISER_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'LEI', "B0011XY", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    dbRow(30, 'LEI', 'RECAT', "'2019-07-01Z00:00'", null, null, '2019-07-22', '2019-08-05', '2019-08-03', rc('C').build())

    //-------------------------------------------------------------------------------------------------------------
    // LEI initial
    dbRow(20, 'LEI', 'INITIAL', "'2019-07-01Z00:00'", null,                   null,                  '2019-07-20', '2019-08-01', '2019-08-03', ic('C').build())
    dbRow(21, 'LEI', 'INITIAL', "'2019-07-01Z00:00'", null,                   null,                  '2019-07-21', '2019-07-31', '2019-08-02', ic('C', 'B').build())

    // LEI initial referred to security
    dbRow(22, 'LEI', 'INITIAL', "'2019-07-01T03:00Z'", "'2019-07-09T15:30Z'", "'2019-07-09T17:40Z'", '2019-07-22', '2019-07-30', '2019-08-03', ic('C').build(), SECURITY_AUTO)
    dbRow(23, 'LEI', 'INITIAL', "'2019-07-01T04:00Z'", "'2019-07-10T09:00Z'", "'2019-07-11T11:00Z'", '2019-07-23', '2019-07-29', '2019-07-28', ic('C', 'B', 'D').securityType(SecurityType.MANUAL).build())
    // .. late

    //-------------------------------------------------------------------------------------------------------------
    // BXI initial
    dbRow(24, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-07-29', '2019-08-03', ic('C', 'B', 'C').build())
    dbRow(25, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-07-29', '2019-08-03', ic('C', 'B').build())

    // BXI initial referred to security
    dbRow(26, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('C').build(), SECURITY_AUTO)
    dbRow(27, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('I').securityType(SecurityType.MANUAL).build())

    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B0012XY'], [12], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardInitialPage

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['C', '', '', '2']
    numbersTableRows[1].find('td')*.text() == ['C', 'B', '', '1']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', 'D', '1']

    securityTableRows[0].find('td')*.text() == ['Manual', '1']
    securityTableRows[1].find('td')*.text() == ['Automatic', '1']
    securityTableRows[2].find('td')*.text() == ['Flagged', '0']

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred 1.75',
      'Security referral timeliness (Days from start to referral) 8.86',
      'Days in security 0.59',
      'Start to assessment completion (days) 20.5',
      'Assessment to approval (days) 9']

    completionTableRows*.text() == [
      'Before due date 75% 3',
      'Late 1']

    total.text() == 'Total: 4'

    when: 'the user selects the whole estate'
    form.scope = 'all'
    submitButton.click()

    then: 'the stats are as follows'
    at DashboardInitialPage
    numbersTableRows[0].find('td')*.text() == ['C', '', '', '3']
    numbersTableRows[1].find('td')*.text() == ['C', 'B', '', '2']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', 'C', '1']
    numbersTableRows[3].find('td')*.text() == ['C', 'B', 'D', '1']
    numbersTableRows[4].find('td')*.text() == ['YOI Closed', '', '', '1']

    securityTableRows[0].find('td')*.text() == ['Manual', '2']
    securityTableRows[1].find('td')*.text() == ['Automatic', '2']
    securityTableRows[2].find('td')*.text() == ['Flagged', '0']

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred 3.38',
      'Security referral timeliness (Days from start to referral) 13.93',
      'Days in security 4.79',
      'Start to assessment completion (days) 20.75',
      'Assessment to approval (days) 8']

    completionTableRows*.text() == [
      'Before due date 87.5% 7',
      'Late 1']

    total.text() == 'Total: 8'

    when: 'the user filters by a date range'
    form.startDate = '30/07/2019'
    form.endDate = '31/07/2019'
    submitButton.click()

    then: 'the total is as follows'
    at DashboardInitialPage
    total.text() == 'Total: 2'
  }

  def "The recat dashboard should show correct stats data"() {
    // ignored as AWAITING_APPROVAL or wrong cat type
    db.doCreateCompleteRow(-10, 10, ic('C').build(), 'CATEGORISER_USER', 'AWAITING_APPROVAL', 'INITIAL', null, null, null, 1, '{}',
      'LEI', "B0010XY", "'2019-07-01T00:00Z'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    db.doCreateCompleteRow(-11, 11, rc('B').build(), 'RECATEGORISER_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'LEI', "B0011XY", "'2019-07-01T00:00Z'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    dbRow(20, 'LEI', 'INITIAL', "'2019-07-01T00:00Z'", null, null, '2019-07-20', '2019-08-01', '2019-08-03', ic('C').build())

    //-------------------------------------------------------------------------------------------------------------
    // LEI recat
    dbRow(30, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-05', '2019-08-03', rc('C').build())
    // .. late
    dbRow(31, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-07-29', '2019-08-03', rc('C', 'B').build())

    // LEI recat referred to security
    dbRow(40, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-08-05', '2019-08-03', rc('B').build(), SECURITY_AUTO)
    dbRow(41, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T04:30Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('C', 'B').securityType(SecurityType.MANUAL).build())
    dbRow(42, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('C').securityType(SecurityType.FLAGGED).build())

    //-------------------------------------------------------------------------------------------------------------
    // BXI recat
    dbRow(50, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-05', '2019-08-03', rc('C').build())
    dbRow(51, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-29', '2019-08-03', rc('B').build())

    // BXI recat referred to security
    dbRow(60, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-01T08:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-08-05', '2019-08-03', rc('C').build(), SECURITY_AUTO)
    dbRow(61, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('C', 'B').securityType(SecurityType.MANUAL).build())

    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B0012XY'], [12], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardRecatPage

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['B', '', '1']
    numbersTableRows[1].find('td')*.text() == ['C', '', '2']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', '2']

    securityTableRows[0].find('td')*.text() == ['Manual', '1']
    securityTableRows[1].find('td')*.text() == ['Automatic', '1']
    securityTableRows[2].find('td')*.text() == ['Flagged', '1']

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred 2.2',
      'Security referral timeliness (Days from start to referral) 9',
      'Days in security 9.06',
      'Start to assessment completion (days) 21',
      'Assessment to approval (days) 9.8']

    completionTableRows*.text() == [
      'Before due date 60% 3',
      'Late 2']

    total.text() == 'Total: 5'

    when: 'the user selects the whole estate'
    form.scope = 'all'
    submitButton.click()

    then: 'the stats are as follows'
    at DashboardRecatPage
    numbersTableRows[0].find('td')*.text() == ['B', '', '2']
    numbersTableRows[1].find('td')*.text() == ['C', '', '4']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', '3']

    securityTableRows[0].find('td')*.text() == ['Manual', '2']
    securityTableRows[1].find('td')*.text() == ['Automatic', '2']
    securityTableRows[2].find('td')*.text() == ['Flagged', '1']

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred -1.56',
      'Security referral timeliness (Days from start to referral) 7.27',
      'Days in security 10.77',
      'Start to assessment completion (days) 21',
      'Assessment to approval (days) 13.56']

    completionTableRows*.text() == [
      'Before due date 44.44% 4',
      'Late 5']

    total.text() == 'Total: 9'

    when: 'the user filters by a date range'
    form.startDate = '05/08/2019'
    form.endDate = '28/08/2019'
    submitButton.click()

    then: 'the total is as follows'
    at DashboardRecatPage
    total.text() == 'Total: 4'
  }

  def "The recat dashboard should show correct change table"() {
    // ignored as AWAITING_APPROVAL or wrong cat type
    db.doCreateCompleteRow(-10, 10, ic('C').build(), 'CATEGORISER_USER', 'AWAITING_APPROVAL', 'INITIAL', null, null, null, 1, '{}',
      'LEI', "B0010XY", "'2019-07-01T00:00Z'", null, null, '2019-08-15', '2019-07-22', '2019-08-03')
    db.doCreateCompleteRow(-11, 11, rc('B').build(), 'RECATEGORISER_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'LEI', "B0011XY", "'2019-07-01T00:00Z'", null, null, '2019-08-15', '2019-07-22', '2019-08-03')

    dbCatRow(100, 1, '2019-02-15', 'LEI', 'C'); dbCatRow(100, 2, '2019-08-15', 'LEI', 'D')
    dbCatRow(101, 4, '2019-02-15', 'LEI', 'C'); dbCatRow(101, 5, '2019-08-15', 'LEI', 'D')
    dbCatRow(102, 6, '2019-02-15', 'LEI', 'C'); dbCatRow(102, 7, '2019-08-15', 'LEI', 'C', 'D')
    dbCatRow(103, 3, '2019-02-15', 'LEI', 'C'); dbCatRow(103, 4, '2019-08-15', 'LEI', 'C')
    dbCatRow(104, 1, '2019-02-15', 'LEI', 'B'); dbCatRow(104, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(105, 1, '2019-02-15', 'LEI', 'B'); dbCatRow(105, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(106, 1, '2019-02-15', 'LEI', 'B'); dbCatRow(106, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(107, 1, '2019-02-15', 'LEI', 'B'); dbCatRow(107, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(108, 1, '2019-02-15', 'LEI', 'B'); dbCatRow(108, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(109, 1, '2019-02-15', 'LEI', 'B'); dbCatRow(109, 2, '2019-08-14', 'LEI', 'B')
    dbCatRow(110, 1, '2019-02-15', 'LEI', 'C'); dbCatRow(110, 2, '2019-08-14', 'LEI', 'B')
    dbCatRow(111, 1, '2019-02-15', 'LEI', 'C'); dbCatRow(111, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(112, 1, '2019-02-15', 'LEI', 'C'); dbCatRow(112, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(113, 1, '2019-02-15', 'LEI', 'C'); dbCatRow(113, 2, '2019-08-15', 'LEI', 'C')
    dbCatRow(114, 1, '2019-02-15', 'LEI', 'I'); dbCatRow(114, 2, '2019-08-15', 'LEI', 'J')
    dbCatRow(115, 1, '2019-02-15', 'LEI', 'I'); dbCatRow(115, 2, '2019-08-15', 'LEI', 'J')
    dbCatRow(116, 1, '2019-02-15', 'LEI', 'I'); dbCatRow(116, 2, '2019-08-15', 'LEI', 'I')
    dbCatRow(117, 1, '2019-02-15', 'LEI', 'I'); dbCatRow(117, 2, '2019-08-15', 'LEI', 'I')
    dbCatRow(118, 1, '2019-02-15', 'LEI', 'I'); dbCatRow(118, 2, '2019-08-15', 'LEI', 'I')
    dbCatRow(119, 1, '2019-02-15', 'LEI', 'D') // <- ignored
    dbCatRow(119, 2, '2019-05-15', 'LEI', 'B'); dbCatRow(119, 3, '2019-08-15', 'LEI', 'C')
    // ignored when filtered:
    dbCatRow(120, 1, '2017-02-15', 'LEI', 'B'); dbCatRow(120, 2, '2017-08-15', 'LEI', 'D')
    dbCatRow(121, 1, '2017-08-15', 'BXI', 'C'); dbCatRow(121, 2, '2019-08-15', 'BXI', 'C')
    // no previous:
    dbCatRow(122, 5, '2019-05-15', 'LEI', 'B')

    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B0012XY'], [12], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardRecatPage

    then: 'The stats displayed are as follows'
    reviewNumbersTableRows[0].find('td')*.text() == ['B', '1', '6', '1', '', '', '8']
    reviewNumbersTableRows[1].find('td')*.text() == ['C', '1', '4', '3', '', '', '8']
    reviewNumbersTableRows[2].find('td')*.text() == ['D', '', '', '', '', '', '0']
    reviewNumbersTableRows[3].find('td')*.text() == ['YOI closed', '', '', '', '3', '2', '5']
    reviewNumbersTableRows[4].find('td')*.text() == ['YOI open', '', '', '', '', '', '0']
    reviewNumbersTableRows[5].find('td')*.text() == ['Total', '2', '10', '4', '3', '2', '21']

    when: 'the user filters by a date range'
    form.startDate = '14/08/2019'
    form.endDate = '14/08/2019'
    submitButton.click()

    then: 'the results totals are now reduced'
    at DashboardRecatPage
    reviewNumbersTableRows[5].find('td')*.text() == ['Total', '2', '0', '0', '0', '0', '2']
  }
}
