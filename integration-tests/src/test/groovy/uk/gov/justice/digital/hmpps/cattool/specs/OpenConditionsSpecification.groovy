package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import org.openqa.selenium.Keys
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.EarliestReleasePage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.ForeignNationalsPage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.FurtherChargesPage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.RiskLevelsPage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.RiskOfHarmPage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.SuitabilityPage

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

  def "The happy path is correct for categoriser, all yeses"() {
    when: 'I go to the first open conditions page'
    db.createData(-1, 12, JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
      ]]))

    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to EarliestReleasePage, 12

    then: 'the Earliest Release page is displayed'
    at EarliestReleasePage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    at EarliestReleasePage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit the page with just threeOrMoreYears=Yes'
    threeOrMoreYearsYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at EarliestReleasePage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit the page with just threeOrMoreYears=Yes and justify=Yes'
    justifyYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at EarliestReleasePage
    errorSummaries*.text() == ['Please enter details']
    errors*.text() == ['Error:\nPlease enter details']

    when: 'the Earliest Release page is completed'
    justifyText << 'details text'
    submitButton.click()
///////////////////////////////////////////////////////////////////////////////
    then: 'the Foreign Nationals page is displayed'
    at ForeignNationalsPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    at ForeignNationalsPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit page after isForeignNationalYes'
    isForeignNationalYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at ForeignNationalsPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit page after formCompletedYes'
    formCompletedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at ForeignNationalsPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit page after dueDeportedYes'
    dueDeportedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at ForeignNationalsPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'the Foreign Nationals page is completed'
    exhaustedAppealNo.click()
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk of Serious Harm page is displayed'
    at RiskOfHarmPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    at RiskOfHarmPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit page after seriousHarmYes'
    seriousHarmYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at RiskOfHarmPage
    errorSummaries*.text() == ['Please select yes or no', 'Please enter details']
    errors*.text() == ['Error:\nPlease select yes or no', 'Error:\nPlease enter details']

    when: 'I submit page after harmManagedYes'
    harmManagedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at RiskOfHarmPage
    errorSummaries*.text() == ['Please enter details']
    errors*.text() == ['Error:\nPlease enter details']

    when: 'the Risk of Serious Harm page is completed'
    harmManagedText << 'harmManagedText details'

    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Further Charges page is displayed'
    at FurtherChargesPage

    when: 'I submit a blank page'
    clearTextarea(furtherChargesText)
    submitButton.click()

    then: 'there is a validation error'
    at FurtherChargesPage
    errorSummaries*.text() == ['Please select yes or no', 'Please enter details']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease select yes or no']

    when: 'the Further Charges page is completed'
    furtherChargesText << ',furtherChargesText details'
    increasedRiskYes.click()

    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk Levels page is displayed'
    at RiskLevelsPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    at RiskLevelsPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit page after likelyToAbscondYes'
    likelyToAbscondYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at RiskLevelsPage
    errorSummaries*.text() == ['Please enter details']
    errors*.text() == ['Error:\nPlease enter details']

    when: 'the Risk Levels page is completed'
    likelyToAbscondText << 'likelyToAbscondText details'

    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Suitability page is displayed'
    at SuitabilityPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    at SuitabilityPage
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'I submit page after isOtherInformationYes'
    isOtherInformationYes.click()
    submitButton.click()

    then: 'there is a validation error'
    at SuitabilityPage
    errorSummaries*.text() == ['Please enter details']
    errors*.text() == ['Error:\nPlease enter details']

    when: 'the Suitability page is completed'
    otherInformationText << 'otherInformationText details'

    submitButton.click()
    then: 'the TBA page is displayed'
    true // at TBA Page TODO

    then: 'Data is stored correctly'
    def response = db.getData(12).form_response

    def data = response[0].toString()
    data.contains '"earliestReleaseDate": {"justify": "Yes", "justifyText": "details text", "threeOrMoreYears": "Yes"}'
    data.contains '"foreignNationals": {"dueDeported": "Yes", "formCompleted": "Yes", "exhaustedAppeal": "No", "isForeignNational": "Yes"}'
    data.contains '"riskOfHarm": {"harmManaged": "Yes", "seriousHarm": "Yes", "harmManagedText": "harmManagedText details"}'
    data.contains '"furtherCharges": {"increasedRisk": "Yes", "furtherChargesText": "some convictions,furtherChargesText details"}'
    data.contains '"riskLevels": {"likelyToAbscond": "Yes", "likelyToAbscondText": "likelyToAbscondText details"}'
    data.contains '"suitability": {"isOtherInformation": "Yes", "otherInformationText": "otherInformationText details"}'
  }

  def "The happy path is correct for categoriser, all nos"() {
    when: 'I go to the first open conditions page'
    db.createData(-1, 12, JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
      ]]))

    elite2api.stubUncategorised()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2api.stubGetOffenderDetails(12)
    to EarliestReleasePage, 12

    then: 'the Earliest Release page is displayed'
    at EarliestReleasePage

    when: 'I submit the page with just threeOrMoreYears=No'
    threeOrMoreYearsNo.click()
    submitButton.click()

///////////////////////////////////////////////////////////////////////////////
    then: 'the Foreign Nationals page is displayed'
    at ForeignNationalsPage

    when: 'I submit page after isForeignNationalNo'
    isForeignNationalNo.click()
    submitButton.click()

////////////////////////////////////////////////////////////////////////////
    then: 'the Risk of Serious Harm page is displayed'
    at RiskOfHarmPage

    when: 'I submit page after seriousHarmNo'
    seriousHarmNo.click()
    submitButton.click()

////////////////////////////////////////////////////////////////////////////
    then: 'the Further Charges page is displayed'
    at FurtherChargesPage

    when: 'the Further Charges page is completed'
    furtherChargesText << ',furtherChargesText details'
    increasedRiskNo.click()

    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk Levels page is displayed'
    at RiskLevelsPage

    when: 'I submit page after likelyToAbscondNo'
    likelyToAbscondNo.click()
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Suitability page is displayed'
    at SuitabilityPage

    when: 'I submit page after isOtherInformationNo'
    isOtherInformationNo.click()
    submitButton.click()

    then: 'the TBA page is displayed'
    true // at TBA Page TODO

    then: 'Data is stored correctly'
    def response = db.getData(12).form_response

    def data = response[0].toString()
    data.contains '"earliestReleaseDate": {"threeOrMoreYears": "No"}'
    data.contains '"foreignNationals": {"isForeignNational": "No"}'
    data.contains '"riskOfHarm": {"seriousHarm": "No"}'
    data.contains '"furtherCharges": {"increasedRisk": "No", "furtherChargesText": "some convictions,furtherChargesText details"}'
    data.contains '"riskLevels": {"likelyToAbscond": "No"}'
    data.contains '"suitability": {"isOtherInformation": "No"}'
  }

  def clearTextarea(ta) {
    ta << Keys.chord(Keys.CONTROL, "a") << Keys.chord(Keys.CONTROL, "x")
  }
}
