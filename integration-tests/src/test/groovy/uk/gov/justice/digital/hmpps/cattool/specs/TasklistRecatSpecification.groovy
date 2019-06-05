package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.ErrorPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class TasklistRecatSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def setup() {
    db.clearDb()
  }

  def "The recat tasklist for a categoriser is present"() {
    when: 'I go to the recat tasklist page'

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    then: 'The tasklist page is displayed'
    headerValue*.text() == ['Hillmob, Ant', 'B2345YZ', '17/02/1970', 'C',
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

    and: 'SOC data is stored and merged correctly'
    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.risk_profile[0].toString())
    response == [socProfile: [nomsId: "B2345YZ", riskType: "SOC", transferToSecurity: false, provisionalCategorisation: 'C']]
  }

  def "The tasklist page displays an alert when status is transferred to security"() {
    when: 'I go to the tasklist page'

    fixture.gotoTasklistRecat(true)
    at TasklistRecatPage

//    elite2Api.stubAssessments(['B2345YZ'])
//    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')

    then: 'the prisoner start button is locked'
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Automatically referred to Security ($today)")
    summarySection[0].text() == 'Check and submit'
    summarySection[1].text() == 'Tasks not yet complete'
  }

  def "The recat tasklist correctly creates a subsequent database sequence when init record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatus(12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]))

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    then: 'The database row is created correctly'
    def data = db.getData(12)
    data.status == ['APPROVED', 'STARTED']
    data.cat_type*.toString() == ['INITIAL', 'RECAT']
    data.sequence_no == [1, 2]
  }

  def "The recat tasklist correctly creates a subsequent database sequence when a completed recat record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatusAndCatType(12, 'APPROVED', '{}', 'RECAT')

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    then: 'The database row is created correctly'
    def data = db.getData(12)
    data.status == ['APPROVED', 'STARTED']
    data.cat_type*.toString() == ['RECAT', 'RECAT']
    data.sequence_no == [1, 2]
  }

  def "The recat tasklist shows an error when an incomplete init record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', '{}', 'INITIAL')

    fixture.gotoTasklistRecat()

    then: 'The correct error is displayed'
    at ErrorPage
    errorSummaryTitle.text() == 'Initial categorisation is still in progress'
  }

  def "The recat tasklist correctly continues the current recat when an incomplete recat record present"() {
    when: 'I go to the recat tasklist page'
    db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT')
    elite2Api.stubGetUserDetails(CATEGORISER_USER, Caseload.LEI.id)
    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    then: 'The single database row is used'
    def data = db.getData(12)
    data.status == ['STARTED']
    data.cat_type*.toString() == ['RECAT']
    data.sequence_no == [1]
  }
}
