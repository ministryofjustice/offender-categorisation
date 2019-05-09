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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserAwaitingApprovalViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSubmittedPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.openConditions.*

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
    given:
    db.createDataWithStatus(12, 'SECURITY_BACK', JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges: [furtherCharges: "Yes", furtherChargesText: "some charges"],
        securityInput   : [securityInputNeeded: 'No'],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "No"],
        escapeRating    : [escapeOtherEvidence: "Yes", escapeOtherEvidenceText: 'Escape Other Evidence Text', escapeCatB: 'No'],
        extremismRating : [previousTerrorismOffences: "Yes", previousTerrorismOffencesText: 'Previous Terrorism Offences Text']
      ], openConditionsRequested : true
    ]))

    when: 'I go to the first open conditions page'

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
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit the page with just threeOrMoreYears=Yes'
    threeOrMoreYearsYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit the page with just threeOrMoreYears=Yes and justify=Yes'
    justifyYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter details']
      errors*.text() == ['Error:\nPlease enter details']
    }

    when: 'the Earliest Release page is completed'
    justifyText << 'details text'
    submitButton.click()
///////////////////////////////////////////////////////////////////////////////
    then: 'the Foreign National page is displayed'
    at ForeignNationalPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after isForeignNationalYes'
    isForeignNationalYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after formCompletedYes'
    formCompletedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after dueDeportedYes'
    dueDeportedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'the Foreign National page is completed'
    exhaustedAppealNo.click()
    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Risk of Serious Harm page is displayed'
    at RiskOfHarmPage

    when: 'I submit a blank page'
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after seriousHarmYes'
    seriousHarmYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no', 'Please enter details']
      errors*.text() == ['Error:\nPlease select yes or no', 'Error:\nPlease enter details']
    }

    when: 'I submit page after harmManagedYes'
    harmManagedYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter details']
      errors*.text() == ['Error:\nPlease enter details']
    }

    when: 'the Risk of Serious Harm page is completed'
    harmManagedText << 'harmManagedText details'

    submitButton.click()
////////////////////////////////////////////////////////////////////////////
    then: 'the Further Charges page is displayed'
    at FurtherChargesPage

    when: 'I submit a blank page'
    form.furtherChargesText = '' // remove existing text
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please select yes or no', 'Please enter details']
      errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease select yes or no']
    }

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
    waitFor {
      errorSummaries*.text() == ['Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I submit page after likelyToAbscondYes'
    likelyToAbscondYes.click()
    submitButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter details']
      errors*.text() == ['Error:\nPlease enter details']
    }

    when: 'the Risk Levels page is completed'
    likelyToAbscondText << 'likelyToAbscondText details'
    submitButton.click()
////////////////////////////////////////////////////////////////////////////


    then: 'I am diverted to the not recommended page'
    at NotRecommendedPage
    reasons*.text() == ['They have further charges which pose an increased risk in open conditions',
                        'They are likely to abscond or otherwise abuse the lower security of open conditions']

    when: 'No is selected and continue button is clicked'
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    elite2api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    stillReferNo.click()
    submitButton.click()

    then: 'tasklist page is displayed without the open conditions section'
    at CategoriserTasklistPage
    !openConditionsButton.isDisplayed()


    when: 'the continue button is clicked'
    elite2api.stubAssessments('B2345YZ')
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly. Data is persisted - regardless of the decision to end the open conditions flow'
    at ReviewPage
    changeLinks.size() == 9

    def response = db.getData(12).form_response
    def data = response[0].toString()
    data.contains '"earliestReleaseDate": {"justify": "Yes", "justifyText": "details text", "threeOrMoreYears": "Yes"}'
    data.contains '"foreignNational": {"dueDeported": "Yes", "formCompleted": "Yes", "exhaustedAppeal": "No", "isForeignNational": "Yes"}'
    data.contains '"riskOfHarm": {"harmManaged": "Yes", "seriousHarm": "Yes", "harmManagedText": "harmManagedText details"}'
    data.contains '"furtherCharges": {"increasedRisk": "Yes", "furtherChargesText": "some charges,furtherChargesText details"}'
    data.contains '"riskLevels": {"likelyToAbscond": "Yes", "likelyToAbscondText": "likelyToAbscondText details"}'
  }

  def "The happy path is correct for categoriser, all nos"() {
    when: 'I go to the first open conditions page'
    db.createData(-1, 12, JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
        furtherCharges: [furtherCharges: "Yes", furtherChargesText: "some charges"],
        securityInput   : [securityInputNeeded: 'No'],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "No"],
        escapeRating    : [escapeOtherEvidence: "Yes", escapeOtherEvidenceText: 'Escape Other Evidence Text', escapeCatB: 'No'],
        extremismRating : [previousTerrorismOffences: "Yes", previousTerrorismOffencesText: 'Previous Terrorism Offences Text']
      ], openConditionsRequested : true]))

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
    then: 'the Foreign National page is displayed'
    at ForeignNationalPage

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
    elite2api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])
    elite2api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    submitButton.click()
////////////////////////////////////////////////////////////////////////////


    then: 'tasklist page is displayed with the open conditions section'
    at CategoriserTasklistPage
    elite2api.stubAssessments('B2345YZ')
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false, true)
    openConditionsButton.isDisplayed()
    continueButton.click()

    then: 'the review page is displayed and Data is stored correctly'
    at ReviewPage
    /*values*.text() == ['', 'No', 'Not applicable', // 1 line per section
                       '', 'No', 'Not applicable', 'Not applicable', 'Not applicable',
                       '', 'No', 'Not applicable',
                       '', 'some charges,furtherChargesText details', 'No',
                       '', 'No']*/

    def response = db.getData(12).form_response
    def data = response[0].toString()
    data.contains '"earliestReleaseDate": {"threeOrMoreYears": "No"}'
    data.contains '"foreignNational": {"isForeignNational": "No"}'
    data.contains '"riskOfHarm": {"seriousHarm": "No"}'
    data.contains '"furtherCharges": {"increasedRisk": "No", "furtherChargesText": "some charges,furtherChargesText details"}'
    data.contains '"riskLevels": {"likelyToAbscond": "No"}'

    when: 'I continue to the provision category page'
    submitButton.click()

    then: 'I am at the provision category page'
    at ProvisionalCategoryPage
    warning.text() contains 'Based on the information provided, the provisional category is D'

    when: 'I confirm the cat D category'
    elite2api.stubCategorise('D')
    appropriateYes.click()
    submitButton.click()

    then: 'the category is submitted'
    at CategoriserSubmittedPage
    db.getData(12).status == ["AWAITING_APPROVAL"]

    when: 'The record is viewed by the categoriser'
    to CategoriserHomePage
    startButtons[0].click()

    then: 'The correct category is retrieved'
    at CategoriserAwaitingApprovalViewPage
    categoryDiv.text() contains 'Category for approval is D'
  }
}
