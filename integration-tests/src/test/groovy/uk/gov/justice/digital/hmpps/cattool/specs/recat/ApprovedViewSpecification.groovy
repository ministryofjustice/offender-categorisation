package uk.gov.justice.digital.hmpps.cattool.specs.recat

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
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ApprovedViewRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class ApprovedViewSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  def setup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The approved view page is correctly displayed (suggested Cat)"() {

    db.createDataWithIdAndStatusAndCatType(-1, 11, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor: [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'RECAT')
    db.createDataWithIdAndStatusAndCatType(-2, 12, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor: [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'RECAT')
    db.createNomisSeqNo(12,7)

    db.createRiskProfileDataForExistingRow(12, '''{
      "socProfile": {"nomsId": "B2345YZ", "riskType": "SOC", "transferToSecurity": false},
      "escapeProfile": {"nomsId": "B2345YZ", "riskType": "ESCAPE", "activeEscapeList": true, "activeEscapeRisk": true,
        "escapeListAlerts" : [ { "active": true, "comment": "First xel comment", "expired": true, "alertCode": "XEL", "dateCreated": "2016-09-14", "alertCodeDescription": "Escape List"}]   
      },
      "violenceProfile": {"nomsId": "B2345YZ", "riskType": "VIOLENCE", "displayAssaults": true, "numberOfAssaults": 5, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 2, "provisionalCategorisation": "C", "veryHighRiskViolentOffender": false},
      "extremismProfile": {"nomsId": "B2345YZ", "riskType": "EXTREMISM", "notifyRegionalCTLead": true, "increasedRiskOfExtremism": true, "provisionalCategorisation": "C"}}''')
    db.createReviewReason(12, 'AGE')

    when: 'the approved view page for B2345YZ is selected'
    navigateToView()

    then: 'the cat details are correct and full prisoner background data is shown'
    headerValue*.text() == fixture.FULL_HEADER
    categories*.text() == ['C\nWarning\nCategory C',
                           'C\nWarning\nThe categoriser recommends category C',
                           'C\nWarning\nThe supervisor also recommends category C']
    !comments.displayed
    comments.size() == 0
    !openConditionsHeader.isDisplayed()
    prisonerBackgroundSummary*.text() == [
      '', 'Age 21', ('Categorisation date Category decision Review location\n' +
      '24/03/2013 B Moorland (HMP & YOI)\n' +
      '04/04/2012 A Moorland (HMP & YOI)'),
      'This person has been reported as the perpetrator in 5 assaults in custody before, including 2 serious assaults in the last 12 months',
      'This person is considered an escape risk\nE-List: First xel comment 2016-09-14 (expired)',
      'This person is at risk of engaging in, or vulnerable to, extremism.', '']
  }

  def "The approved view page is correctly displayed (Cat overridden by supervisor)"() {

    db.createDataWithIdAndStatusAndCatType(-1, 11, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor: [review: [supervisorCategoryAppropriate: "Yes"]]
    ]), 'RECAT')
    db.createDataWithIdAndStatusAndCatType(-2, 12, 'APPROVED', JsonOutput.toJson([
      recat     : [decision: [category: "C"]],
      supervisor : [review: [supervisorCategoryAppropriate   : "No", supervisorOverriddenCategory: "D",
                             supervisorOverriddenCategoryText: "Here are the supervisor's comments on why the category was changed"]],
      openConditions: [riskLevels: [likelyToAbscond: "No"], riskOfHarm: [seriousHarm: "No"], foreignNational: [isForeignNational: "No"], earliestReleaseDate: [threeOrMoreYears: "No"]]
    ]), 'RECAT')
    db.createNomisSeqNo(12,7)

    when: 'the approved view page for B2345YZ is selected'
    navigateToView()

    then: 'the cat details are correct'
    categories*.text() == ['D\nWarning\nCategory D',
                           'C\nWarning\nThe categoriser recommends category C',
                           'C\nD\nWarning\nThe recommended category was changed from a C to a D']
    comments.text() == 'Here are the supervisor\'s comments on why the category was changed'
    openConditionsHeader.isDisplayed()

    when: "I click on the button"
    submitButton.click()

    then: "I return to the supervisor done page"
    at SupervisorDonePage
  }

  def "The approved view page is correctly displayed (recat role)"() {
    db.createDataWithIdAndStatusAndCatType(-1, 12, 'APPROVED', JsonOutput.toJson([
      recat: fixture.defaultRecat]), 'RECAT')

    when: 'the re-categoriser goes to the approved view page'
    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubCategorised([12])
    doneTabLink.click()
    at RecategoriserDonePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false)
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubAgencyDetails('LPI') // existing assessments
    elite2Api.stubAgencyDetails('LEI') // where this cat was done
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    viewButtons[0].click()

    then: 'the approved view page is shown'
    at ApprovedViewRecatPage
  }

  private navigateToView() {

    elite2Api.stubUncategorisedAwaitingApproval()
    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage

    elite2Api.stubCategorised([12])
    elite2Api.stubAgencyDetails('LEI')
    doneTabLink.click()
    at SupervisorDonePage

    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false)
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubAgencyDetails('LPI')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    viewButtons[1].click()

    at ApprovedViewRecatPage
  }
}
