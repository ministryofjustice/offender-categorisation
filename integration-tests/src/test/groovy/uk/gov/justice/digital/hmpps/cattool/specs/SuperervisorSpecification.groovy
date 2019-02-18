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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSecurityInputPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorReviewPage

import java.time.LocalDate
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class SuperervisorSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  def setup() {
    db.clearDb()
  }

  def cleanup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)
  DatabaseUtils db = new DatabaseUtils()


  def "The supervisor review page can be displayed"() {
    given: 'supervisor is viewing the home page'
    db.createData(12, JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ]]))

    def now = LocalDate.now()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    def daysSinceSentence11 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate11, now))
    def daysSinceSentence12 = String.valueOf(ChronoUnit.DAYS.between(sentenceStartDate12, now))
    // 14 days after sentenceStartDate
    elite2api.stubUncategorisedForSupervisor()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)

    at SupervisorHomePage

    when: 'supervisor selects an offender'
    elite2api.stubGetOffenderDetails(12)
    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', true)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)

    startButtons[0].click()


    then: 'the review is displayed with the saved form details'

    at(new SupervisorReviewPage())

    //todo once category is persisted
  }
}
