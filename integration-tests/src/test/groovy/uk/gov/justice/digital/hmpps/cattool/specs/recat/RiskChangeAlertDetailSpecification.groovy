package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserPotentialReviewsPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RiskProfileChangeDetailPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER

class RiskChangeAlertDetailSpecification extends AbstractSpecification {

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

    when: 'I select yes to process'
    elite2Api.stubUpdateNextReviewDate(LocalDate.now().plusDays(fixture.get10BusinessDays()).format('yyyy-MM-dd'))

    elite2Api.stubGetOffenderDetails(12, 'B2345XY')
    riskProfilerApi.stubForTasklists('B2345XY', 'C', false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
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

  void gotoRiskChangeDetail() {
    /* db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([
       ratings: TestFixture.defaultRatingsC]), 'INITIAL') */
    def raisedDate = LocalDate.of(2019, 1, 31)
    def oldProfile = JsonOutput.toJson([
      "soc": ["nomsId": "B2345XY", "riskType": "SOC", "transferToSecurity": false, "provisionalCategorisation": "C"],
      "escape": ["nomsId": "G5021GJ", "riskType": "ESCAPE", "activeEscapeList": false, "activeEscapeRisk": false, "escapeListAlerts": [], "escapeRiskAlerts": [], "provisionalCategorisation": "C"],
      "violence": ["nomsId": "G5021GJ", "riskType": "VIOLENCE", "displayAssaults": true, "numberOfAssaults": 10, "notifySafetyCustodyLead": false, "numberOfSeriousAssaults": 0, "provisionalCategorisation": "C", "veryHighRiskViolentOffender": false]])
    def newProfile = JsonOutput.toJson([
      "soc": ["nomsId": "B2345XY", "riskType": "SOC", "transferToSecurity": true, "provisionalCategorisation": "C"],
      "escape": ["nomsId": "G5021GJ", "riskType": "ESCAPE", "activeEscapeList": false, "activeEscapeRisk": true, "escapeListAlerts": [], "escapeRiskAlerts": [["active": true, "alertId": 23, "comment": "text", "expired": false, "ranking": 0, "alertCode": "XER", "alertType": "X", "bookingId": 869603, "offenderNo": "G5021GJ", "dateCreated": "2016-08-15", "alertCodeDescription": "Escape Risk", "alertTypeDescription": "Security"]], "provisionalCategorisation": "C"],
      "violence": ["nomsId": "G5021GJ", "riskType": "VIOLENCE", "displayAssaults": true, "numberOfAssaults": 10, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 1, "provisionalCategorisation": "B", "veryHighRiskViolentOffender": false]])

    db.createRiskChange(-1, 'B2345XY', null, 'NEW',
      oldProfile,
      newProfile,
      'LEI',
      raisedDate)

    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])

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
