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
  Elite2Api elite2api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  def setup() {
    db.clearDb()
  }

  def cleanup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
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
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]),SECURITY_USER.username, Timestamp.valueOf(reviewDate1.atStartOfDay()))

    db.createSecurityReviewedData(-1,14, 'APPROVED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        securityInput   : [securityInputNeeded: "Yes"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]),SECURITY_USER.username, Timestamp.valueOf(reviewDate2.atStartOfDay()))

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)


    // 14 days after sentenceStartDate
    elite2api.stubUncategorisedForSupervisor()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    elite2api.stubUncategorised()
    elite2api.stubGetUserDetails(SECURITY_USER, 'LEI')

    fixture.loginAs(SECURITY_USER)
    at SecurityHomePage

    elite2api.stubCategorised()
    elite2api.stubGetOffenderDetailsByBookingIdList('LEI')
    elite2api.stubGetSecurityStaffDetailsByUsername()

    doneTabLink.click()

    then: 'The security done page is displayed'

    at SecurityDonePage

    prisonNos == ['AB321', 'AB123']
    names == ['Dent, Jane', 'Clark, Frank']
    def today = LocalDate.now().format('dd/MM/yyyy')
    reviewedDates == ['31/01/2019','28/01/2019']
    reviewer == ['Security, Amy', 'Security, Amy']
  }

}
