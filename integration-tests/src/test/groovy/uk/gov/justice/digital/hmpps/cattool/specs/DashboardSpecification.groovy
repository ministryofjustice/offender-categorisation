package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class DashboardSpecification extends GebReportingSpec {

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
  def dbRow(bookingId, prisonId, catType, startDate, referredDate, securityReviewedDate, assessmentDate, approvalDate, dueByDate, json, riskProfile) {
    db.doCreateCompleteRow(-bookingId, bookingId, json,catType == 'INITIAL' ? 'CATEGORISER_USER': 'RECATEGORISER_USER', 'APPROVED', catType, null, referredDate, null, 1, riskProfile,
      prisonId, "B00${bookingId}XY", startDate, null, securityReviewedDate, approvalDate, assessmentDate, dueByDate)
  }

  String ic(suggested, overridden = null, supervisor = null) {
    def over = overridden ? """, "overriddenCategory":"$overridden" """ : ''
    def superv = supervisor ? """"supervisorOverriddenCategory": "$supervisor" """ : ''
    return """{ "categoriser": {"provisionalCategory":{"suggestedCategory": "$suggested"$over}}, 
                "supervisor": {"review": {$superv}}}"""
  }

  String rc(suggested, supervisor = null) {
    def superv = supervisor ? """"supervisorOverriddenCategory": "$supervisor" """ : ''
    return """{"recat": {"decision": {"category": "$suggested"}}, 
               "supervisor": {"review": {$superv}}}"""
  }

  /*
  def "The initial cat dashboard should show correct stats data"() {
    // ignored as AWAITING_APPROVAL or wrong cat type
    db.doCreateCompleteRow(-10, 10, ic('C'), 'CATEGORISER_USER', 'AWAITING_APPROVAL', 'INITIAL', null, null, null, 1, '{}',
      'LEI', "B0010XY", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    db.doCreateCompleteRow(-11, 11, rc('B'), 'RECATEGORISER_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'LEI', "B0011XY", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    dbRow(30, 'LEI', 'RECAT', "'2019-07-01Z00:00'", null, null, '2019-07-22', '2019-08-05', '2019-08-03', rc('C'), '{}')

    //-------------------------------------------------------------------------------------------------------------
    // LEI initial
    dbRow(20, 'LEI', 'INITIAL', "'2019-07-01Z00:00'", null,                   null,                  '2019-07-20', '2019-08-01', '2019-08-03', ic('C'), '{}')
    dbRow(21, 'LEI', 'INITIAL', "'2019-07-01Z00:00'", null,                   null,                  '2019-07-21', '2019-07-31', '2019-08-02', ic('C', 'B'), '{}')

    // LEI initial referred to security
    dbRow(22, 'LEI', 'INITIAL', "'2019-07-01T03:00Z'", "'2019-07-09T15:30Z'", "'2019-07-09T17:40Z'", '2019-07-22', '2019-07-30', '2019-08-03', ic('C'), SECURITY_AUTO)
    dbRow(23, 'LEI', 'INITIAL', "'2019-07-01T04:00Z'", "'2019-07-10T09:00Z'", "'2019-07-11T11:00Z'", '2019-07-23', '2019-07-29', '2019-07-28', ic('C', 'B', 'D'), '{}') // late

    //-------------------------------------------------------------------------------------------------------------
    // BXI initial
    dbRow(24, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-07-29', '2019-08-03', ic('C', 'B', 'C'), '{}')
    dbRow(25, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-07-29', '2019-08-03', ic('C', 'B'), '{}')

    // BXI initial referred to security
    dbRow(26, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('C'), SECURITY_AUTO)
    dbRow(27, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('I'), '{}')

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

    referralManual.text() == 'Manual: 1'
    referralAuto.text() == 'Auto: 1'

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred 1.75',
      'Security referral timeliness (Hours from start to referral) 212.75',
      'Hours in security 14.08',
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

    referralManual.text() == 'Manual: 2'
    referralAuto.text() == 'Auto: 2'

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred 3.38',
      'Security referral timeliness (Hours from start to referral) 334.38',
      'Hours in security 115.04',
      'Start to assessment completion (days) 20.75',
      'Assessment to approval (days) 8']

    completionTableRows*.text() == [
      'Before due date 87.5% 7',
      'Late 1']

    total.text() == 'Total: 8'

    when: 'the user filters by a date range'
    form.startDate='30/07/2019'
    form.endDate='31/07/2019'
    submitButton.click()

    then: 'the total is as follows'
    at DashboardInitialPage
    total.text() == 'Total: 2'
  } */

  def "The recat dashboard should show correct stats data"() {
    // ignored as AWAITING_APPROVAL or wrong cat type
    db.doCreateCompleteRow(-10, 10, ic('C'), 'CATEGORISER_USER', 'AWAITING_APPROVAL', 'INITIAL', null, null, null, 1, '{}',
      'LEI', "B0010XY", "'2019-07-01T00:00Z'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    db.doCreateCompleteRow(-11, 11, rc('B'), 'RECATEGORISER_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'LEI', "B0011XY", "'2019-07-01T00:00Z'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')
    dbRow(20, 'LEI', 'INITIAL', "'2019-07-01T00:00Z'", null, null, '2019-07-20', '2019-08-01', '2019-08-03', ic('C'), '{}')

    //-------------------------------------------------------------------------------------------------------------
    // LEI recat
    dbRow(30, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-05', '2019-08-03', rc('C'), '{}') // late
    dbRow(31, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-07-29', '2019-08-03', rc('C', 'B'), '{}')

    // LEI recat referred to security
    dbRow(40, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-08-05', '2019-08-03', rc('B'), SECURITY_AUTO)
    dbRow(41, 'LEI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T04:30Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('C', 'B'), '{}')

    //-------------------------------------------------------------------------------------------------------------
    // BXI recat
    dbRow(50, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-05', '2019-08-03', rc('C'), '{}')
    dbRow(51, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-29', '2019-08-03', rc('B'), '{}')

    // BXI recat referred to security
    dbRow(60, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-01T08:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-08-05', '2019-08-03', rc('C'), SECURITY_AUTO)
    dbRow(61, 'BXI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('C', 'B'), '{}')

    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B0012XY'], [12], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardRecatPage

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['B', '', '1']
    numbersTableRows[1].find('td')*.text() == ['C', '', '1']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', '2']

    referralManual.text() == 'Manual: 1'
    referralAuto.text() == 'Auto: 1'

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred 1.5',
      'Security referral timeliness (Hours from start to referral) 216',
      'Hours in security 218.25',
      'Start to assessment completion (days) 21',
      'Assessment to approval (days) 10.5']

    completionTableRows*.text() == [
      'Before due date 50% 2',
      'Late 2']

    total.text() == 'Total: 4'

    when: 'the user selects the whole estate'
    form.scope = 'all'
    submitButton.click()

    then: 'the stats are as follows'
    at DashboardRecatPage
    numbersTableRows[0].find('td')*.text() == ['B', '', '2']
    numbersTableRows[1].find('td')*.text() == ['C', '', '3']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', '3']

    referralManual.text() == 'Manual: 2'
    referralAuto.text() == 'Auto: 2'

    timelinessTableRows*.text() == [
      'Number of days before due date that approval occurred -2.37',
      'Security referral timeliness (Hours from start to referral) 164',
      'Hours in security 269.13',
      'Start to assessment completion (days) 21',
      'Assessment to approval (days) 14.38']

    completionTableRows*.text() == [
      'Before due date 37.5% 3',
      'Late 5']

    total.text() == 'Total: 8'

    when: 'the user filters by a date range'
    form.startDate='05/08/2019'
    form.endDate='28/08/2019'
    submitButton.click()

    then: 'the total is as follows'
    at DashboardRecatPage
    total.text() == 'Total: 4'
  }
}
