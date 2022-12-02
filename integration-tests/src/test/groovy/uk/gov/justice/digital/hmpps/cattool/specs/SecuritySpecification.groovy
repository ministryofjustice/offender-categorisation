package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityUpcomingPage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityViewPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class SecuritySpecification extends AbstractSpecification {

  def "The done page for a security user is present"() {
    when: 'I go to the home page as security and select the done tab'

    db.createSecurityReviewedData(-2, 13, 'B2345XY', 'SECURITY_BACK', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "over ridden category text"]],
      security: [review: [securityReview: "this is the text from the security team for a recat"]]]),SECURITY_USER.username, "'2019-01-28'", 'RECAT')

    db.createRiskProfileDataForExistingRow(13, JsonOutput.toJson([socProfile: [nomsId: "G1110GX", riskType: "SOC", transferToSecurity: true, provisionalCategorisation: "C"]]))

    db.createSecurityReviewedData(-1,14, 'B2345YZ','APPROVED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        securityInput   : [securityInputNeeded: "Yes", securityInputNeededText: "Comments from Categoriser"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "over ridden category text"]
      ],
      security: [review: [securityReview: "this is the text from the security team"]]]),SECURITY_USER.username, "'2019-01-31'")

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)


    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    elite2Api.stubUncategorised()
    elite2Api.stubGetUserDetails(SECURITY_USER, 'LEI')

    fixture.loginAs(SECURITY_USER)
    at SecurityHomePage

    elite2Api.stubCategorised()
    elite2Api.stubGetOffenderDetailsByOffenderNoList(['B2345XY', 'B2345YZ'])
    elite2Api.stubGetStaffDetailsByUsernameList()

    doneTabLink.click()

    then: 'The security done page is displayed'

    at SecurityDonePage

    prisonNos == ['B2345YZ', 'B2345XY']
    names == ['Dent, Jane', 'Clark, Frank']
    def today = LocalDate.now().format('dd/MM/yyyy')
    reviewedDates == ['31/01/2019','28/01/2019']
    reviewer == ['Lastname_security_user, Firstname_security_user', 'Lastname_security_user, Firstname_security_user']
    catTypes == ['Initial', 'Recat']

    when: 'user click the view button'
    elite2Api.stubGetOffenderDetails(14)
    viewButtons[0].click()

    then: 'security details are displayed'
    at SecurityViewPage
    securityInputSummary*.text() == ['Manual', 'Comments from Categoriser', 'this is the text from the security team']


    when: 'user view a recat record'
    to SecurityDonePage
    elite2Api.stubGetOffenderDetails(13)
    viewButtons[1].click()

    then: 'security details are displayed'
    at SecurityViewPage
    securityInputSummary*.text() == ['Automatic', 'this is the text from the security team for a recat']

  }

  def "The upcoming page for a security user is present"() {
    when: 'I go to the home page as security and select the upcoming tab'
    db.createSecurityData('B2345XY', 'LEI', 1, 'NEW')
    db.createSecurityData('B2345YZ', 'LEI', 2, 'NEW')

    def sentenceStartDate13 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate14 = LocalDate.of(2019, 1, 31)

    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [13, 14], [sentenceStartDate13.toString(), sentenceStartDate14.toString()])
    elite2Api.stubGetUserDetails(SECURITY_USER, 'LEI')

    fixture.loginAs(SECURITY_USER)
    at SecurityHomePage

    elite2Api.stubGetOffenderDetailsByOffenderNoList(['B2345XY', 'B2345YZ'])
    elite2Api.stubGetStaffDetailsByUsernameList()

    upcomingTabLink.click()

    then: 'The security upcoming page is displayed'
    at SecurityUpcomingPage
    prisonNos == ['B2345XY', 'B2345YZ']
    names == ['Clark, Frank','Dent, Jane']
    def today = LocalDate.now().format('dd/MM/yyyy')
    dueDates == ['11/02/2019', '14/02/2019',]
    referrer == ['Lastname_security_user, Firstname_security_user', 'Lastname_security_user, Firstname_security_user']
  }
}
