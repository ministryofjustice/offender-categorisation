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

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class CategoriserDoneSpecification extends GebReportingSpec {

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

  def "The done page for a categoriser is present"() {
    when: 'I go to the home page as categoriser'
    db.createDataWithStatus(-1,12, 'APPROVED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ]]))

    db.createDataWithStatus(-2,11, 'APPROVED', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeOtherEvidence: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ]]))

    def now = LocalDate.now()
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])

    fixture.loginAs(CATEGORISER_USER)


    at CategoriserHomePage

    elite2Api.stubCategorised()

    doneTabLink.click()

    then: 'The categoriser done page is displayed'

    at CategoriserDonePage

    prisonNos == ['B2345XY', 'B2345YZ']
    names == ['Scramble, Tim', 'Hemmel, Sarah']

    approvalDates == ['21/02/2019', '20/02/2019']
    categorisers == ['Lamb, John', 'Fan, Jane']
    approvers == ['Helly, James', 'Helly, James']
  }

  def "The done page does not display offenders that haven't been categorised through the Categorisation tool"() {
    when: 'I go to the home page as categoriser'

    def now = LocalDate.now()
    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])

    fixture.loginAs(CATEGORISER_USER)

    at CategoriserHomePage

    elite2Api.stubCategorised()

    doneTabLink.click()

    then: 'The categoriser done page is displayed without the "PNOMIS" categorised offenders'

    at CategoriserDonePage

    prisonNos == []
    noResultsDiv.isDisplayed()

  }

}
