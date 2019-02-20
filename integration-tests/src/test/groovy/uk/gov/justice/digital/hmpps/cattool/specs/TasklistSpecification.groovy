package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class TasklistSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)
  DatabaseUtils db = new DatabaseUtils()

  def setup() {
    db.clearDb()
  }

  def cleanup() {
    db.clearDb()
  }

  def "The tasklist for a categoriser is present"() {
    when: 'I go to the tasklist page'
    fixture.gotoTasklist()

    then: 'The tasklist page is displayed'
    at(new CategoriserTasklistPage(bookingId: '12'))

    headerValue*.text() == ['Hillmob, Ant', 'B2345YZ', '17/02/1970',
                            'C-04-02', 'Coventry',
                            'Latvian',
                            'A Felony', 'Another Felony',
                            '10/06/2020',
                            '11/06/2020',
                            '02/02/2020',
                            '13/06/2020',
                            '14/06/2020',
                            '15/06/2020',
                            '16/06/2020',
                            '17/06/2020',
                            '6 years, 3 months']
    !continueButton
    continueButtonDisabled.displayed
  }

  def "The continue button behaves correctly"() {
    when: 'I go to the tasklist page with all sections complete'
    db.createData(12, JsonOutput.toJson([
      ratings: [
        offendingHistory: [previousConvictions: "some convictions"],
        securityInput   : [securityInputNeeded: "No"],
        violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
        escapeRating    : [escapeFurtherCharges: "Yes"],
        extremismRating : [previousTerrorismOffences: "Yes"]
      ]]))
    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))

    then: 'The continue button takes me to the review page'
    continueButton.displayed
    !continueButtonDisabled
  }
}
