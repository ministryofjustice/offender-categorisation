package uk.gov.justice.digital.hmpps.cattool.specs

import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.DashboardInitialPage
import uk.gov.justice.digital.hmpps.cattool.pages.DashboardRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.WOMEN_SUPERVISOR_USER

class DashboardWomenSpecification extends AbstractSpecification {

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
    db.doCreateCompleteRow(-bookingId, bookingId, json,  'FEMALE_USER', 'APPROVED', catType, null, referredDate, null, 1, riskProfile,
      prisonId, "ON${bookingId}", startDate, null, securityReviewedDate, approvalDate, assessmentDate, dueByDate)
  }

  int dbCatRow(bookingId, seq, approvedDate, prisonId, suggested, supervisor = null, catType = 'RECAT') {
    return db.doCreateCompleteRow(-bookingId * seq, bookingId, rc(suggested, supervisor).build(), 'FEMALE_USER', 'APPROVED', catType, null, null, null, seq, '{}',
      prisonId, "ON${bookingId}", "'2019-07-01T00:00Z'", null, null, approvedDate, '2019-07-22', '2019-08-03')
  }


  JasonBuilder ic(suggested, supervisor = null) {
    def b = new JasonBuilder(catType: CatType.INITIAL, suggested: suggested, supervisor: supervisor)
    return b
  }

  JasonBuilder rc(suggested, supervisor = null) {
    def b = new JasonBuilder(catType: CatType.RECAT, suggested: suggested, supervisor: supervisor)
    return b
  }

  def "The initial cat dashboard should show correct women and YOI stats data"() {
    // ignored as AWAITING_APPROVAL or wrong cat type
    db.doCreateCompleteRow(-10, 700, ic('R').build(), 'FEMALE_USER', 'AWAITING_APPROVAL', 'INITIAL', null, null, null, 1, '{}',
      'PFI', "ON700", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')

    //-------------------------------------------------------------------------------------------------------------
    // PFI initial
    dbRow(30, 'PFI', 'INITIAL', "'2019-07-01Z00:00'", null, null, '2019-07-20', '2019-08-01', '2019-08-03', ic('R').build())
    dbRow(31, 'PFI', 'INITIAL', "'2019-07-01Z00:00'", null, null, '2019-07-21', '2019-07-31', '2019-08-02', ic('R', 'T').build())

    // PFI initial referred to security
    dbRow(32, 'PFI', 'INITIAL', "'2019-07-01T03:00Z'", "'2019-07-09T15:30Z'", "'2019-07-09T17:40Z'", '2019-07-22', '2019-07-30', '2019-08-03', ic('R').build(), SECURITY_AUTO)
    dbRow(33, 'PFI', 'INITIAL', "'2019-07-01T04:00Z'", "'2019-07-10T09:00Z'", "'2019-07-11T11:00Z'", '2019-07-23', '2019-07-29', '2019-07-28', ic('T', 'T').securityType(SecurityType.MANUAL).build())
    // .. late

    //-------------------------------------------------------------------------------------------------------------
    // LNI initial
    dbRow(34, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", null, null, '2019-07-22', '2019-07-29', '2019-08-03', ic('R', 'R').build())
    dbRow(35, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", null, null, '2019-07-22', '2019-07-29', '2019-08-03', ic('R', 'T').build())

    // LEI MEN  INITIAL
    dbRow(22, 'LEI', 'INITIAL', "'2019-07-01T03:00Z'", "'2019-07-09T15:30Z'", "'2019-07-09T17:40Z'", '2019-07-22', '2019-07-30', '2019-08-03', ic('C').build(), SECURITY_AUTO)

    // LNI initial referred to security
    dbRow(36, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('R').build(), SECURITY_AUTO)
    dbRow(37, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('T').securityType(SecurityType.MANUAL).build())


    dbRow(70, 'PFI', 'INITIAL', "'2019-07-01Z00:00'", null, null, '2019-07-20', '2019-08-01', '2019-08-03', ic('I').build())
    dbRow(71, 'PFI', 'INITIAL', "'2019-07-01Z00:00'", null, null, '2019-07-21', '2019-07-31', '2019-08-02', ic('I', 'J').build())

    // PFI initial referred to security
    dbRow(72, 'PFI', 'INITIAL', "'2019-07-01T03:00Z'", "'2019-07-09T15:30Z'", "'2019-07-09T17:40Z'", '2019-07-22', '2019-07-30', '2019-08-03', ic('I').build(), SECURITY_AUTO)
    dbRow(73, 'PFI', 'INITIAL', "'2019-07-01T04:00Z'", "'2019-07-10T09:00Z'", "'2019-07-11T11:00Z'", '2019-07-23', '2019-07-29', '2019-07-28', ic('J', 'I').securityType(SecurityType.MANUAL).build())


    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval('PFI')
    prisonerSearchApi.stubSentenceData(['ON700'], [700], ['28/01/2019'])
    fixture.loginAs(WOMEN_SUPERVISOR_USER)
    at SupervisorHomePage
    elite2Api.stubGetOffenderDetailsWomen(700, "ON700")
    elite2Api.stubAssessmentsWomen(['ON700'])
    elite2Api.stubAgencyDetails('PFI')
    elite2Api.stubSentenceDataGetSingle('ON700', '2014-11-23')

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardInitialPage

    then: 'all female prisons option is displayed'
    at DashboardInitialPage
    statsTypeOptions*.text().contains('all female prisons')

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['YOI closed', '', '25.0%', '2']
    numbersTableRows[1].find('td')*.text() == ['YOI closed', 'YOI open', '12.5%', '1']
    numbersTableRows[2].find('td')*.text() == ['YOI open', 'YOI closed', '12.5%', '1']
    numbersTableRows[3].find('td')*.text() == ['Closed', '', '25.0%', '2']
    numbersTableRows[4].find('td')*.text() == ['Closed', 'Open', '12.5%', '1']
    numbersTableRows[5].find('td')*.text() == ['Open', 'Open', '12.5%', '1']

    securityTableRows[0].find('td')*.text() == ['Manual', '2']
    securityTableRows[1].find('td')*.text() == ['Automatic', '2']
    securityTableRows[2].find('td')*.text() == ['Flagged', '0']
    securityTableRows[3].find('td')*.text() == ['Total', '4']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 8.5 days',
      'Sent to security to security review complete 0.5 days',
      'Security review complete to approval complete 19.5 days',
      'Assessment started to approval complete 29.5 days']

    completionTableRows*.text() == [
      'Before due date 75.0% 6',
      'Late 25.0% 2',
      'Total 8']

    when: 'the user selects the whole estate'
    form.scope = 'all'
    submitButton.click()

    then: 'the stats are as follows'
    at DashboardInitialPage
    numbersTableRows[0].find('td')*.text() == ['YOI closed', '', '16.7%', '2']
    numbersTableRows[1].find('td')*.text() == ['YOI closed', 'YOI open', '8.3%', '1']
    numbersTableRows[2].find('td')*.text() == ['YOI open', 'YOI closed', '8.3%', '1']
    numbersTableRows[3].find('td')*.text() == ['Closed', '', '25.0%', '3']
    numbersTableRows[4].find('td')*.text() == ['Closed', 'Closed', '8.3%', '1']
    numbersTableRows[5].find('td')*.text() == ['Closed', 'Open', '16.7%', '2']
    numbersTableRows[6].find('td')*.text() == ['Open', '', '8.3%', '1']
    numbersTableRows[7].find('td')*.text() == ['Open', 'Open', '8.3%', '1']

    securityTableRows[0].find('td')*.text() == ['Manual', '3']
    securityTableRows[1].find('td')*.text() == ['Automatic', '3']
    securityTableRows[2].find('td')*.text() == ['Flagged', '0']
    securityTableRows[3].find('td')*.text() == ['Total', '6']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 12 days',
      'Sent to security to security review complete 3.33 days',
      'Security review complete to approval complete 13 days',
      'Assessment started to approval complete 29 days']

    completionTableRows*.text() == [
      'Before due date 83.3% 10',
      'Late 16.7% 2',
      'Total 12']
  }


  def "The recat dashboard should show correct women stats data"() {

    db.doCreateCompleteRow(-10, 700, ic('R').build(), 'FEMALE_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'PFI', "ON700", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')

    db.doCreateCompleteRow(-11, 701, rc('R').build(), 'FEMALE_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'PFI', "ON700", "'2019-07-01T00:00Z'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')


    dbRow(30, 'PFI', 'INITIAL', "'2019-07-01Z00:00'", null, null, '2019-07-20', '2019-08-01', '2019-08-03', ic('R').build())

    //-------------------------------------------------------------------------------------------------------------
    // PFI recat
    dbRow(38, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-05', '2019-08-03', rc('R').build())
    // .. late
    dbRow(39, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-07-29', '2019-08-03', rc('R', 'T').build())

    // PFI recat referred to security
    dbRow(40, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-08-05', '2019-08-03', rc('R').build(), SECURITY_AUTO)
    dbRow(41, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T04:30Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('T', 'R').securityType(SecurityType.MANUAL).build())
    dbRow(42, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('R').securityType(SecurityType.FLAGGED).build())

    //-------------------------------------------------------------------------------------------------------------
    // LNI recat
    dbRow(50, 'LNI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-05', '2019-08-03', rc('T').build())
    dbRow(51, 'LNI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-29', '2019-08-03', rc('R').build())

    // LNI recat referred to security
    dbRow(60, 'LNI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-01T08:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-08-05', '2019-08-03', rc('R').build(), SECURITY_AUTO)
    dbRow(61, 'LNI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('T', 'R').securityType(SecurityType.MANUAL).build())

    dbRow(80, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-08-05', '2019-08-03', rc('I').build(), SECURITY_AUTO)
    dbRow(81, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T04:30Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('J', 'I').securityType(SecurityType.MANUAL).build())
    dbRow(82, 'PFI', 'RECAT', "'2019-07-01T00:00Z'", "'2019-07-10T00:00Z'", "'2019-07-19T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', rc('J').securityType(SecurityType.FLAGGED).build())

    //-------------------------------------------------------------------------------------------------------------
    // LNI recat
    dbRow(90, 'LNI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-05', '2019-08-03', rc('J').build())
    dbRow(91, 'LNI', 'RECAT', "'2019-07-01T00:00Z'", null,                  null,                  '2019-07-22', '2019-08-29', '2019-08-03', rc('I').build())


    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval('PFI')
    prisonerSearchApi.stubSentenceData(['ON700'], [700], ['28/01/2019'])
    fixture.loginAs(WOMEN_SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardRecatPage

    then: 'all female prisons option is displayed'
    at DashboardRecatPage
    statsTypeOptions*.text().contains('all female prisons')

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['YOI closed', '', '12.5%', '1']
    numbersTableRows[1].find('td')*.text() == ['YOI open', '', '12.5%', '1']
    numbersTableRows[2].find('td')*.text() == ['YOI open', 'YOI closed', '12.5%',  '1']
    numbersTableRows[3].find('td')*.text() == ['Closed', '', '37.5%', '3']
    numbersTableRows[4].find('td')*.text() == ['Closed', 'Open', '12.5%', '1']
    numbersTableRows[5].find('td')*.text() == ['Open', 'Closed', '12.5%',  '1']



    securityTableRows[0].find('td')*.text() == ['Manual', '2']
    securityTableRows[1].find('td')*.text() == ['Automatic', '2']
    securityTableRows[2].find('td')*.text() == ['Flagged', '2']
    securityTableRows[3].find('td')*.text() == ['Total', '6']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 9 days',
      'Sent to security to security review complete 9 days',
      'Security review complete to approval complete 12.33 days',
      'Assessment started to approval complete 30.63 days']

    completionTableRows*.text() == [
      'Before due date 62.5% 5',
      'Late 37.5% 3',
      'Total 8']

    when: 'the user selects the whole estate'
    form.scope = 'all'
    submitButton.click()

    then: 'the stats are as follows'
    at DashboardRecatPage
    numbersTableRows[0].find('td')*.text() == ['YOI closed', '', '14.3%', '2']
    numbersTableRows[1].find('td')*.text() == ['YOI open', '', '14.3%', '2']
    numbersTableRows[2].find('td')*.text() == ['YOI open', 'YOI closed', '7.1%', '1']
    numbersTableRows[3].find('td')*.text() == ['Closed', '', '35.7%', '5']
    numbersTableRows[4].find('td')*.text() == ['Closed', 'Open', '7.1%', '1']
    numbersTableRows[5].find('td')*.text() == ['Open', '', '7.1%', '1']
    numbersTableRows[6].find('td')*.text() == ['Open', 'Closed', '14.3%',  '2']

    securityTableRows[0].find('td')*.text() == ['Manual', '3']
    securityTableRows[1].find('td')*.text() == ['Automatic', '3']
    securityTableRows[2].find('td')*.text() == ['Flagged', '2']
    securityTableRows[3].find('td')*.text() == ['Total', '8']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 7.88 days',
      'Sent to security to security review complete 10.13 days',
      'Security review complete to approval complete 12.63 days',
      'Assessment started to approval complete 35.43 days']

    completionTableRows*.text() == [
      'Before due date 42.9% 6',
      'Late 57.1% 8',
      'Total 14']
  }

  def "The recat dashboard should show correct change table for Women"() {

    db.doCreateCompleteRow(-10, 700, ic('R').build(), 'FEMALE_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'PFI', "ON700", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')

    db.doCreateCompleteRow(-11, 701, rc('R').build(), 'FEMALE_USER', 'AWAITING_APPROVAL', 'RECAT', null, null, null, 1, '{}',
      'PFI', "ON700", "'2019-07-01T00:00Z'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')

    dbCatRow(100, 1, '2019-02-15', 'PFI', 'R'); dbCatRow(100, 2, '2019-08-15', 'PFI', 'T')
    dbCatRow(101, 4, '2019-02-15', 'PFI', 'T'); dbCatRow(101, 5, '2019-08-15', 'PFI', 'R')
    dbCatRow(102, 6, '2019-02-15', 'PFI', 'R'); dbCatRow(102, 7, '2019-08-15', 'PFI', 'R', 'T')
    dbCatRow(103, 3, '2019-02-15', 'PFI', 'T'); dbCatRow(103, 4, '2019-08-15', 'PFI', 'T')
    dbCatRow(104, 1, '2019-02-15', 'PFI', 'R'); dbCatRow(104, 2, '2019-08-15', 'PFI', 'T')
    dbCatRow(105, 1, '2019-02-15', 'PFI', 'R'); dbCatRow(105, 2, '2019-08-15', 'PFI', 'T')
    dbCatRow(106, 1, '2019-02-15', 'PFI', 'R'); dbCatRow(106, 2, '2019-08-15', 'PFI', 'T')
    dbCatRow(107, 1, '2019-02-15', 'PFI', 'R'); dbCatRow(107, 2, '2019-08-15', 'PFI', 'T')
    dbCatRow(108, 1, '2019-02-15', 'PFI', 'J'); dbCatRow(108, 2, '2019-08-15', 'PFI', 'I')
    dbCatRow(109, 1, '2019-02-15', 'PFI', 'R'); dbCatRow(109, 2, '2019-08-14', 'PFI', 'R')
    dbCatRow(110, 1, '2019-02-15', 'PFI', 'T'); dbCatRow(110, 2, '2019-08-14', 'PFI', 'R')
    dbCatRow(111, 1, '2019-02-15', 'PFI', 'J'); dbCatRow(111, 2, '2019-08-15', 'PFI', 'J')
    dbCatRow(112, 1, '2019-02-15', 'PFI', 'T'); dbCatRow(112, 2, '2019-08-15', 'PFI', 'T')
    dbCatRow(113, 1, '2019-02-15', 'PFI', 'T'); dbCatRow(113, 2, '2019-08-15', 'PFI', 'T')
    dbCatRow(114, 1, '2019-02-15', 'PFI', 'I'); dbCatRow(114, 2, '2019-08-15', 'PFI', 'J')
    dbCatRow(115, 1, '2019-02-15', 'PFI', 'I'); dbCatRow(115, 2, '2019-08-15', 'PFI', 'J')
    dbCatRow(116, 1, '2019-02-15', 'PFI', 'I'); dbCatRow(116, 2, '2019-08-15', 'PFI', 'J')
    dbCatRow(117, 1, '2019-02-15', 'PFI', 'I'); dbCatRow(117, 2, '2019-08-15', 'PFI', 'I')
    dbCatRow(118, 1, '2019-02-15', 'PFI', 'J'); dbCatRow(118, 2, '2019-08-15', 'PFI', 'I')
    dbCatRow(119, 1, '2019-02-15', 'PFI', 'T') // <- NOT ignored are previous category
    dbCatRow(119, 2, '2019-05-15', 'PFI', 'J'); dbCatRow(119, 3, '2019-08-15', 'PFI', 'I')
    dbCatRow(120, 1, '2017-02-15', 'PFI', 'R'); dbCatRow(120, 2, '2017-08-15', 'PFI', 'T')
    // ignored when filtered:
    dbCatRow(121, 1, '2017-08-15', 'LNI', 'J'); dbCatRow(121, 2, '2019-08-15', 'LNI', 'J')
    // no previous:
    dbCatRow(122, 5, '2019-05-15', 'PFI', 'J')

    // INITIAL R -> RECAT T
    dbCatRow(123, 1, '2016-02-15', 'PFI', 'R', null,'INITIAL'); dbCatRow(123, 2, '2016-08-15', 'PFI', 'T', null, 'RECAT')

    given: 'a supervisor is logged in'
    elite2Api.stubUncategorisedAwaitingApproval('PFI')
    prisonerSearchApi.stubSentenceData(['ON700'], [700], ['28/01/2019'])
    fixture.loginAs(WOMEN_SUPERVISOR_USER)

    when: 'the user goes to the dashboard with no search criteria'
    to DashboardRecatPage
    statsTypeOptions*.text().contains('all female prisons')

    then: 'The stats displayed are as follows'
    reviewNumbersTableRows[0].find('td')*.text() == ['Open', '3', '2', '', '1', '6']
    reviewNumbersTableRows[1].find('td')*.text() == ['Closed', '8', '1', '', '', '9']
    reviewNumbersTableRows[2].find('td')*.text() == ['YOI closed', '', '', '1', '3', '4']
    reviewNumbersTableRows[3].find('td')*.text() == ['YOI open', '', '', '3', '1', '4']
    reviewNumbersTableRows[4].find('td')*.text() == ['Total', '11', '3', '4', '5', '23']

    when: 'the user filters to an end date'
    form.startDate = ''
    form.endDate = '14/08/2019'
    submitButton.click()

    then: 'the results totals are now reduced'
    at DashboardRecatPage
    reviewNumbersTableRows[4].find('td')*.text() == ['Total', '2', '2', '0', '1', '5']

    when: 'the user filters from a start date to an end date'
    form.startDate = '16/08/2017'
    form.endDate = '14/08/2019'
    submitButton.click()

    then: 'the results totals are now reduced'
    at DashboardRecatPage
    reviewNumbersTableRows[4].find('td')*.text() == ['Total', '0', '2', '0', '1', '3']

    when: 'the user filters a period when initial R was recategorised as T'
    form.startDate = '15/08/2016'
    form.endDate = '15/08/2016'
    submitButton.click()

    then: 'the R to T transition is shown'
    at DashboardRecatPage
    reviewNumbersTableRows[4].find('td')*.text() == ['Total', '1', '0', '0', '0', '1']
  }

}
