package uk.gov.justice.digital.hmpps.cattool.specs.recat

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserPotentialReviewsPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RiskProfileChangeDetailPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER

class RiskChangeAlertDetailSpecification extends GebReportingSpec {

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


  def "The risk change alert displays alert comparisons correctly"() {
    when: 'I view a risk change alert with all sections'

    gotoRiskChangeDetail()

    then: 'The risk change is displayed appropriately'

    at RiskProfileChangeDetailPage

    securityWarning.isDisplayed()
    violenceNotifyWarning.isDisplayed()
    violenceWarningNew.isDisplayed()
    violenceWarningOld.isDisplayed()
    escapeWarning.isDisplayed()
    escapeAlerts.isDisplayed()
    escapeAlertsOld.isDisplayed()
    extremismNotifyWarning.isDisplayed()
    increasedRiskExtremismWarning.isDisplayed()

    when: 'I select yes to process'
    elite2Api.stubUpdateNextReviewDate(LocalDate.now().plusDays(fixture.get10BusinessDays()))

    elite2Api.stubGetOffenderDetails(12, 'B2345XY')
    riskProfilerApi.stubGetSocProfile('B2345XY', 'C', false)
    answerYes.click()
    submitButton.click()

    then: 'I am redirected to the recat tasklist for a new categorisation'
    at TasklistRecatPage

    def data = db.getRiskChange('B2345XY')
    data.status == ["REVIEW_REQUIRED"]

  }

  def "The risk change alert can be ignored"() {
    when: 'I view a risk change alert with all sections'

    gotoRiskChangeDetail()

    then: 'The risk change is displayed appropriately'

    at RiskProfileChangeDetailPage

    when: 'no is selected'
    answerNo.click()
    submitButton.click()

    then: 'The status is updated and Potential reviews displayed'
    at RecategoriserPotentialReviewsPage

    def data = db.getRiskChange('B2345XY')
    data.status == ["REVIEW_NOT_REQUIRED"]
    noResultsText.isDisplayed()
  }

  def void gotoRiskChangeDetail() {
   /* db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]), 'INITIAL') */
    def raisedDate = LocalDate.of(2019, 1, 31)
    def oldProfile = '{"soc": {"nomsId": "B2345XY", "riskType": "SOC", "transferToSecurity": false, "provisionalCategorisation": "C"}, "escape": {"nomsId": "G5021GJ", "riskType": "ESCAPE", "activeEscapeList": false, "activeEscapeRisk": false, "escapeListAlerts": [], "escapeRiskAlerts": [], "provisionalCategorisation": "C"}, "violence": {"nomsId": "G5021GJ", "riskType": "VIOLENCE", "displayAssaults": true, "numberOfAssaults": 10, "notifySafetyCustodyLead": false, "numberOfSeriousAssaults": 0, "provisionalCategorisation": "C", "veryHighRiskViolentOffender": false}, "extremism": {"nomsId": "G5021GJ", "riskType": "EXTREMISM", "notifyRegionalCTLead": false, "increasedRiskOfExtremism": false, "provisionalCategorisation": "C"}}'
    def newProfile = '{"soc": {"nomsId": "B2345XY", "riskType": "SOC", "transferToSecurity": true, "provisionalCategorisation": "C"}, "escape": {"nomsId": "G5021GJ", "riskType": "ESCAPE", "activeEscapeList": false, "activeEscapeRisk": true, "escapeListAlerts": [], "escapeRiskAlerts": [{"active": true, "alertId": 23, "comment": "WozkLbgfVNNRkjsYGmLfWozkLbgfVNNRkjsYGmLf", "expired": false, "ranking": 0, "alertCode": "XER", "alertType": "X", "bookingId": 869603, "offenderNo": "G5021GJ", "dateCreated": "2016-08-15", "alertCodeDescription": "Escape Risk", "alertTypeDescription": "Security"}], "provisionalCategorisation": "C"}, "violence": {"nomsId": "G5021GJ", "riskType": "VIOLENCE", "displayAssaults": true, "numberOfAssaults": 10, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 1, "provisionalCategorisation": "B", "veryHighRiskViolentOffender": false}, "extremism": {"nomsId": "G5021GJ", "riskType": "EXTREMISM", "notifyRegionalCTLead": true, "increasedRiskOfExtremism": true, "provisionalCategorisation": "C"}}'

    db.createRiskChange(-1, 'B2345XY', null, 'NEW',
      oldProfile,
      newProfile,
      'LEI',
      raisedDate)

    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage

    elite2Api.stubGetOffenderDetailsByOffenderNoList(['B2345XY'])
    elite2Api.stubGetLatestCategorisationForOffenders()

    checkTabLink.click()

    at RecategoriserPotentialReviewsPage

    elite2Api.stubGetOffenderDetails(12, 'B2345XY')

    selectFirstPrisoner()
  }

  def selectFirstPrisoner() {
    checkButtons[0].click()
  }
}
