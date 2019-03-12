package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.After
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSecurityInputPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ReviewPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class ReviewSpecification extends GebReportingSpec {

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


  def "The review page can be displayed"() {
    given: 'data has been entered for the ratings pages'
    db.createData(12, JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        // securityInput omitted
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "No"]
      ]]))
    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments('B2345YZ')
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2api.stubOffenceHistory('B2345YZ')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', false)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)

    securityButton.click()

    at(new CategoriserSecurityInputPage(bookingId: '12'))
    securityRadio = 'No'
    saveButton.click()

    at(new CategoriserTasklistPage(bookingId: '12'))

    when: 'The edit link is selected'
    continueButton.click()

    then: 'the review is displayed with the saved form details'
    at ReviewPage
    warnings[0].text() contains 'This offender was categorised as a Cat A in 2012 until 2013 for a previous sentence and released as a Cat B in 2014'
    offendingHistoryText.text() == 'some convictions'
    $('#securityQ1').text() == 'No'
    $('#violenceQ1').text() == 'No'
    $('#violenceQ2').text() == 'Yes'
    veryHighRiskViolentOffenderMessage.text().contains('Violent in custody Text TBC')
    warnings[2].text() contains 'This person is considered an escape risk'
    $('#escapeQ1').text() == 'Yes'
    warnings[3].text() contains 'There is data to indicate that this person has an increased risk of engaging in extremism'

    def response = db.getData(12)[0].form_response
    def json = response.toString()
    json.contains '"history": {"catAType": "A",'
    json.contains '"socProfile": {"nomsId": "B2345YZ", "riskType": "SOC", "transferToSecurity": false'
    json.contains '"escapeProfile": {"nomsId": "B2345YZ", "riskType": "ESCAPE", "activeEscapeList": true, "activeEscapeRisk": true,'
    json.contains '"violenceProfile": {"nomsId": "B2345YZ", "riskType": "VIOLENCE", "displayAssaults": false, "notifySafetyCustodyLead": true, "provisionalCategorisation": "C", "veryHighRiskViolentOffender": true}'
    json.contains '"extremismProfile": {"nomsId": "B2345YZ", "riskType": "EXTREMISM", "increasedRisk": true, "notifyRegionalCTLead": false, "provisionalCategorisation": "C"}'
  }
}
