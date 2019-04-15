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

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class SecuritySpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  def setup() {
    db.clearDb()
  }

  def cleanup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()


  def "The done page for a security is present"() {
    when: 'I go to the home page as security and select the done tab'

    db.createDataWithStatus(-2, 12, 'SECURITY_AUTO', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    db.createDataWithStatus(-1,11, 'SECURITY_MANUAL', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        securityInput   : [securityInputNeeded: "Yes"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ],
      categoriser: [provisionalCategory: [suggestedCategory: "C", overriddenCategory: "D", categoryAppropriate: "No", overriddenCategoryText: "Some Text"]]]))

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)


    fixture.loginAs(SECURITY_USER)
    at SecurityHomePage

    elite2api.stubCategorised()

    doneTabLink.click()

    then: 'The security done page is displayed'

    at SecurityDonePage

    prisonNos == ['B2345XY', 'B2345YZ']
    names == ['Scramble, Tim', 'Hemmel, Sarah']
    reviewDates == ['21/02/2019', '20/02/2019']
    reviewers == ['Helly, James', 'Helly, James']
  }

}
