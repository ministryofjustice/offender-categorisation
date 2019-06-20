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

import java.sql.Timestamp
import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class SecuritySpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  def setup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()


  def "The done page for a security user is present"() {
    when: 'I go to the home page as security and select the done tab'

    def reviewDate1 = LocalDate.of(2019, 1, 28)
    def reviewDate2 = LocalDate.of(2019, 1, 31)

    db.createSecurityReviewedData(-2, 13, 'SECURITY_BACK', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]],
      security: [review: [securityReview: "this is the text from the security team for a recat"]]]),SECURITY_USER.username, Timestamp.valueOf(reviewDate1.atStartOfDay()), 'RECAT')

    db.createRiskProfileDataForExistingRow(13, JsonOutput.toJson([socProfile: [nomsId: "G1110GX", riskType: "SOC", transferToSecurity: true, provisionalCategorisation: "C"]]))

    db.createSecurityReviewedData(-1,14, 'APPROVED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        securityInput   : [securityInputNeeded: "Yes", securityInputNeededText: "Comments from Categoriser"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]
      ],
      security: [review: [securityReview: "this is the text from the security team"]]]),SECURITY_USER.username, Timestamp.valueOf(reviewDate2.atStartOfDay()))

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)


    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedForSupervisor()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    elite2Api.stubUncategorised()
    elite2Api.stubGetUserDetails(SECURITY_USER, 'LEI')

    fixture.loginAs(SECURITY_USER)
    at SecurityHomePage

    elite2Api.stubCategorised()
    elite2Api.stubGetOffenderDetailsByBookingIdList('LEI')
    elite2Api.stubGetSecurityStaffDetailsByUsernameList()

    doneTabLink.click()

    then: 'The security done page is displayed'

    at SecurityDonePage

    prisonNos == ['AB321', 'AB123']
    names == ['Dent, Jane', 'Clark, Frank']
    def today = LocalDate.now().format('dd/MM/yyyy')
    reviewedDates == ['31/01/2019','28/01/2019']
    reviewer == ['Security, Amy', 'Security, Amy']
    catTypes == ['Initial', 'Recat']

    when: 'user click the view button'
    elite2Api.stubGetOffenderDetails(14)
    viewButtons[0].click()

    then: 'security details are displayed'
    at SupervisorViewPage
    securityInputSummary*.text() == ['Manual', 'Comments from Categoriser', 'this is the text from the security team']


    when: 'user view a recat record'
    to SecurityDonePage
    elite2Api.stubGetOffenderDetails(13)
    viewButtons[1].click()

    then: 'security details are displayed'
    at SupervisorViewPage
    securityInputSummary*.text() == ['Automatic', 'this is the text from the security team for a recat']

  }
}
