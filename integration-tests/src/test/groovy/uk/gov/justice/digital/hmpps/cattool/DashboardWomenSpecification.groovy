package uk.gov.justice.digital.hmpps.cattool


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.DashboardInitialPage
import uk.gov.justice.digital.hmpps.cattool.pages.DashboardRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER
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
    db.doCreateCompleteRow(-bookingId, bookingId, json, catType == 'INITIAL' ? 'FEMALE_USER' : 'FEMALE_USER', 'APPROVED', catType, null, referredDate, null, 1, riskProfile,
      prisonId, "ON${bookingId}", startDate, null, securityReviewedDate, approvalDate, assessmentDate, dueByDate)
  }


  JasonBuilder ic(suggested, overridden = null, supervisor = null) {
    def b = new JasonBuilder(catType: CatType.INITIAL, suggested: suggested, overridden: overridden, supervisor: supervisor)
    return b
  }


  def "The initial cat dashboard should show correct women stats data"() {
    // ignored as AWAITING_APPROVAL or wrong cat type
    db.doCreateCompleteRow(-10, 700, ic('R').build(), 'FEMALE_USER', 'AWAITING_APPROVAL', 'INITIAL', null, null, null, 1, '{}',
      'PFI', "ON700", "'2019-07-01Z00:00'", null, null, '2019-07-29', '2019-07-22', '2019-08-03')

    //-------------------------------------------------------------------------------------------------------------
    // PFI initial
    dbRow(30, 'PFI', 'INITIAL', "'2019-07-01Z00:00'", null, null, '2019-07-20', '2019-08-01', '2019-08-03', ic('R').build())
    dbRow(31, 'PFI', 'INITIAL', "'2019-07-01Z00:00'", null, null, '2019-07-21', '2019-07-31', '2019-08-02', ic('R', 'T').build())

    // PFI initial referred to security
    dbRow(32, 'PFI', 'INITIAL', "'2019-07-01T03:00Z'", "'2019-07-09T15:30Z'", "'2019-07-09T17:40Z'", '2019-07-22', '2019-07-30', '2019-08-03', ic('R').build(), SECURITY_AUTO)
    dbRow(33, 'PFI', 'INITIAL', "'2019-07-01T04:00Z'", "'2019-07-10T09:00Z'", "'2019-07-11T11:00Z'", '2019-07-23', '2019-07-29', '2019-07-28', ic('T', 'R', 'T').securityType(SecurityType.MANUAL).build())
    // .. late

    //-------------------------------------------------------------------------------------------------------------
    // LNI initial
    dbRow(34, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", null, null, '2019-07-22', '2019-07-29', '2019-08-03', ic('R', 'T', 'R').build())
    dbRow(35, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", null, null, '2019-07-22', '2019-07-29', '2019-08-03', ic('R', 'T').build())

    // LNI initial referred to security
    dbRow(36, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('R').build(), SECURITY_AUTO)
    dbRow(37, 'LNI', 'INITIAL', "'2019-07-01T00:00Z'", "'2019-07-20T00:00Z'", "'2019-07-29T00:00Z'", '2019-07-22', '2019-07-29', '2019-08-03', ic('T').securityType(SecurityType.MANUAL).build())

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

    then: 'all male prisons option is displayed'
    at DashboardInitialPage
    statsTypeOptions*.text().contains('all female prisons')

    then: 'The stats displayed are as follows'
    numbersTableRows[0].find('td')*.text() == ['Closed', '', '', '50.0%', '2']
    numbersTableRows[1].find('td')*.text() == ['Closed', 'Open', '', '25.0%', '1']
    numbersTableRows[2].find('td')*.text() == ['Open', 'Closed', 'Open', '25.0%', '1']

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
    numbersTableRows[0].find('td')*.text() == ['Closed', '', '', '37.5%', '3']
    numbersTableRows[1].find('td')*.text() == ['Closed', 'Open', '', '25.0%', '2']
    numbersTableRows[2].find('td')*.text() == ['Closed', 'Open', 'Closed', '12.5%', '1']
    numbersTableRows[3].find('td')*.text() == ['Open', '', '', '12.5%', '1']
    numbersTableRows[4].find('td')*.text() == ['Open', 'Closed', 'Open', '12.5%', '1']

    securityTableRows[0].find('td')*.text() == ['Manual', '2']
    securityTableRows[1].find('td')*.text() == ['Automatic', '2']
    securityTableRows[2].find('td')*.text() == ['Flagged', '0']
    securityTableRows[3].find('td')*.text() == ['Total', '4']

    timelineTableRows*.text() == [
      'Assessment started to sent to security 13.75 days',
      'Sent to security to security review complete 4.75 days',
      'Security review complete to approval complete 9.75 days',
      'Assessment started to approval complete 28.75 days']

    completionTableRows*.text() == [
      'Before due date 87.5% 7',
      'Late 12.5% 1',
      'Total 8']
  }
}
