package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.DashboardInitialPage
import uk.gov.justice.digital.hmpps.cattool.pages.DashboardRecatPage

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class DashboardSpecification extends AbstractSpecification {

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

  static final SECURITY_AUTO = '{"socProfile":{"transferToSecurity":"true"}}'

  /** convenience method to make data setup calls as succinct as possible */
  def dbRow(bookingId, prisonId, catType, startDate, referredDate, securityReviewedDate, assessmentDate, approvalDate, dueByDate, json, riskProfile = '{}') {
    db.doCreateCompleteRow(-bookingId, bookingId, json, catType == 'INITIAL' ? 'CATEGORISER_USER' : 'RECATEGORISER_USER', 'APPROVED', catType, null, referredDate, null, 1, riskProfile,
      prisonId, "B00${bookingId}XY", startDate, null, securityReviewedDate, approvalDate, assessmentDate, dueByDate)
  }

  int dbCatRow(bookingId, seq, approvedDate, prisonId, suggested, supervisor = null, catType = 'RECAT') {
    return db.doCreateCompleteRow(-bookingId * seq, bookingId, rc(suggested, supervisor).build(), 'RECATEGORISER_USER', 'APPROVED', catType, null, null, null, seq, '{}',
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
    dbRow(28, 'BXI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('C').build(), SECURITY_AUTO)

    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceData(['B0012XY'], [12], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardInitialPage

    then: 'all male prisons option is displayed'
    at DashboardInitialPage
    statsTypeOptions*.text().contains('all male prisons')

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['C', '', '', '50.0%', '2']
    numbersTableRows[1].find('td')*.text() == ['C', 'B', '', '25.0%', '1']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', 'D', '25.0%', '1']

    securityTableRows[0].find('td')*.text() == ['Manual', '1']
    securityTableRows[1].find('td')*.text() == ['Automatic', '1']
    securityTableRows[2].find('td')*.text() == ['Flagged', '0']
    securityTableRows[3].find('td')*.text() == ['Total', '2']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 8.5 days',
      'Sent to security to security review complete 0.5 days',
      'Security review complete to approval complete 19.5 days',
      'Assessment started to approval complete 29.5 days']

    completionTableRows*.text() == [
      'Before due date 75.0% 3',
      'Late 25.0% 1',
      'Total 4']

    when: 'the user selects the whole estate'
    form.scope = 'all'
    submitButton.click()

    then: 'the stats are as follows'
    at DashboardInitialPage
    numbersTableRows[0].find('td')*.text() == ['C', '', '', '44.4%', '4']
    numbersTableRows[1].find('td')*.text() == ['C', 'B', '', '22.2%', '2']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', 'C', '11.1%', '1']
    numbersTableRows[3].find('td')*.text() == ['C', 'B', 'D', '11.1%', '1']
    numbersTableRows[4].find('td')*.text() == ['YOI Closed', '', '', '11.1%', '1']

    securityTableRows[0].find('td')*.text() == ['Manual', '2']
    securityTableRows[1].find('td')*.text() == ['Automatic', '3']
    securityTableRows[2].find('td')*.text() == ['Flagged', '0']
    securityTableRows[3].find('td')*.text() == ['Total', '5']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 14.8 days',
      'Sent to security to security review complete 5.6 days',
      'Security review complete to approval complete 7.8 days',
      'Assessment started to approval complete 28.67 days']

    completionTableRows*.text() == [
      'Before due date 88.9% 8',
      'Late 11.1% 1',
      'Total 9']
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
    prisonerSearchApi.stubSentenceData(['B0012XY'], [12], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardRecatPage

    then: 'all male prisons option is displayed'
    at DashboardRecatPage
    statsTypeOptions*.text().contains('all male prisons')

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['B', '', '20.0%', '1']
    numbersTableRows[1].find('td')*.text() == ['C', '', '40.0%', '2']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', '40.0%',  '2']

    securityTableRows[0].find('td')*.text() == ['Manual', '1']
    securityTableRows[1].find('td')*.text() == ['Automatic', '1']
    securityTableRows[2].find('td')*.text() == ['Flagged', '1']
    securityTableRows[3].find('td')*.text() == ['Total', '3']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 9 days',
      'Sent to security to security review complete 9 days',
      'Security review complete to approval complete 12.33 days',
      'Assessment started to approval complete 30.8 days']

    completionTableRows*.text() == [
      'Before due date 60.0% 3',
      'Late 40.0% 2',
      'Total 5']

    when: 'the user selects the whole estate'
    form.scope = 'all'
    submitButton.click()

    then: 'the stats are as follows'
    at DashboardRecatPage
    numbersTableRows[0].find('td')*.text() == ['B', '', '22.2%', '2']
    numbersTableRows[1].find('td')*.text() == ['C', '', '44.4%', '4']
    numbersTableRows[2].find('td')*.text() == ['C', 'B', '33.3%', '3']

    securityTableRows[0].find('td')*.text() == ['Manual', '2']
    securityTableRows[1].find('td')*.text() == ['Automatic', '2']
    securityTableRows[2].find('td')*.text() == ['Flagged', '1']
    securityTableRows[3].find('td')*.text() == ['Total', '5']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 7.2 days',
      'Sent to security to security review complete 10.8 days',
      'Security review complete to approval complete 12.8 days',
      'Assessment started to approval complete 34.56 days']

    completionTableRows*.text() == [
      'Before due date 44.4% 4',
      'Late 55.6% 5',
      'Total 9']
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
    dbCatRow(119, 1, '2019-02-15', 'LEI', 'D') // <- NOT ignored are previous category
    dbCatRow(119, 2, '2019-05-15', 'LEI', 'B'); dbCatRow(119, 3, '2019-08-15', 'LEI', 'C')
    dbCatRow(120, 1, '2017-02-15', 'LEI', 'B'); dbCatRow(120, 2, '2017-08-15', 'LEI', 'D')
    // ignored when filtered:
    dbCatRow(121, 1, '2017-08-15', 'BXI', 'C'); dbCatRow(121, 2, '2019-08-15', 'BXI', 'C')
    // no previous:
    dbCatRow(122, 5, '2019-05-15', 'LEI', 'B')

    // INITIAL B -> RECAT D
    dbCatRow(123, 1, '2016-02-15', 'LEI', 'B', null,'INITIAL'); dbCatRow(123, 2, '2016-08-15', 'LEI', 'D', null, 'RECAT')

    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceData(['B0012XY'], [12], ['28/01/2019'])
    fixture.loginAs(SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardRecatPage

    then: 'The stats displayed are as follows'
    reviewNumbersTableRows[0].find('td')*.text() == ['B', '1', '6', '2', '', '', '9']
    reviewNumbersTableRows[1].find('td')*.text() == ['C', '1', '4', '3', '', '', '8']
    reviewNumbersTableRows[2].find('td')*.text() == ['D', '1', '', '', '', '', '1']
    reviewNumbersTableRows[3].find('td')*.text() == ['YOI closed', '', '', '', '3', '2', '5']
    reviewNumbersTableRows[4].find('td')*.text() == ['YOI open', '', '', '', '', '', '0']
    reviewNumbersTableRows[5].find('td')*.text() == ['Total', '3', '10', '5', '3', '2', '23']

    when: 'the user filters to an end date'
    form.startDate = ''
    form.endDate = '14/08/2019'
    submitButton.click()

    then: 'the results totals are now reduced'
    at DashboardRecatPage
    reviewNumbersTableRows[5].find('td')*.text() == ['Total', '3', '0', '2', '0', '0', '5']

    when: 'the user filters from a start date to an end date'
    form.startDate = '16/08/2017'
    form.endDate = '14/08/2019'
    submitButton.click()

    then: 'the results totals are now reduced'
    at DashboardRecatPage
    reviewNumbersTableRows[5].find('td')*.text() == ['Total', '3', '0', '0', '0', '0', '3']

    when: 'the user filters a period when initial B was recategorised as D'
    form.startDate = '15/08/2016'
    form.endDate = '15/08/2016'
    submitButton.click()

    then: 'the B to D transition is shown'
    at DashboardRecatPage
    reviewNumbersTableRows[5].find('td')*.text() == ['Total', '0', '0', '1', '0', '0', '1']
  }
}
