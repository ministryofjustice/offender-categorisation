package uk.gov.justice.digital.hmpps.cattool.specs.recat

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserPotentialReviewsPage

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoField
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.*

class PotentialReviewsSpecification extends GebReportingSpec {

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


  def "The Potential reviews page is displayed correctly when no results"() {
    when: 'I go to the Potential review page (without any results)'
    db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]), 'INITIAL')
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage

    checkTabLink.click()

    then: 'The recategoriser Potential reviews page is displayed'
    at RecategoriserPotentialReviewsPage

    doneTabLink.isDisplayed()
    todoTabLink.isDisplayed()

    noResultsText.text() == 'No risk changes found.'

  }

  def "The Potential reviews page is displayed correctly when risk changes are present"() {
    when: 'I go to the Potential review page (without any results)'
    db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]), 'INITIAL')
    def raisedDate = LocalDate.of(2019, 1, 31)
    db.createRiskChange(-1, 'B2345XY', null, 'NEW',
      JsonOutput.toJson([socProfile: [nomsId: "B2345XY", riskType: "SOC", transferToSecurity: true, provisionalCategorisation: "C"]]),
      JsonOutput.toJson([socProfile: [nomsId: "B2345XY", riskType: "SOC", transferToSecurity: true, provisionalCategorisation: "C"]]),
      'LEI',
      raisedDate)

    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage

    elite2Api.stubGetOffenderDetailsByOffenderNoList(['B2345XY'])
    elite2Api.stubGetLatestCategorisationForOffenders()

    then: 'Potential reviews link indicates that there is 1 potential review'
    checkTabLink.text() == 'Potential reviews\n1'

    when: 'Potential review link is clicked'
    checkTabLink.click()

    then: 'The recategoriser Potential reviews page is displayed with the risk change summary'
    at RecategoriserPotentialReviewsPage

    raisedDates == ['31/01/2019']
    names == ['Clark, Frank']
    prisonNos == ['B2345XY']
    dueDate == ['25/07/2019']

  }
}
