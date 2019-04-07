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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.EarliestReleasePage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.ForeignNationalsPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class OpenConditionsSpecification extends GebReportingSpec {

  def setup() {
    db.clearDb()
  }

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The happy path is correct for categoriser"() {
    when: 'I go to the first open conditions page'
    db.createData(-1,12, JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ]]))

    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to EarliestReleasePage, 12

    then: 'the Earliest Release page is displayed'
    at EarliestReleasePage

    when: 'the Earliest Release page is completed'
    threeOrMoreYearsYes .click()
    justifyYes.click()
    justifyText << 'details text'

    submitButton.click()

    then: 'the Foreign Nationals page is displayed'
    at ForeignNationalsPage

    when: 'the Foreign Nationals page is completed'

    isForeignNationalYes .click()
    formCompletedYes.click()
    dueDeportedYes.click()
    exhaustedAppealNo.click()

    submitButton.click()
    then: 'the TBA page is displayed'
    true // at TBA Page // TODO

    then: 'Data is stored correctly'
    def response = db.getData(12).form_response

    def data = response[0].toString()
    data.contains '"openConditions": {"foreignNationals": {"dueDeported": "Yes", "formCompleted": "Yes", "exhaustedAppeal": "No", "isForeignNational": "Yes"}, "earliestReleaseDate": {"justify": "Yes", "justifyText": "details text", "threeOrMoreYears": "Yes"}}'
    data.contains '"openConditions": {"foreignNationals": {"dueDeported": "Yes", "formCompleted": "Yes", "exhaustedAppeal": "No", "isForeignNational": "Yes"}, "earliestReleaseDate": {"justify": "Yes", "justifyText": "details text", "threeOrMoreYears": "Yes"}}'
  }
}
