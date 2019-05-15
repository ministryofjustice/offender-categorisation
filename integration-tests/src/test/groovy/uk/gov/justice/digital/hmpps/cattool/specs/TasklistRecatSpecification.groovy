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
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
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
    db.createRiskProfileData(12, JsonOutput.toJson([
      "escapeProfile": [nomsId: "Dummy"]
    ]))

    gotoTasklistRecat()

    then: 'The tasklist page is displayed'
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

    and: 'SOC data is stored and merged correctly'
    def data = db.getData(12)
    data.status == ["STARTED"]
    def response = new JsonSlurper().parseText(data.risk_profile[0].toString())
    response == [socProfile   : [nomsId: "B2345YZ", riskType: "SOC", transferToSecurity: false, provisionalCategorisation: 'C'],
                 escapeProfile: [nomsId: "Dummy"]]
  }

  def "The tasklist page displays an alert when status is transferred to security"() {
    when: 'I go to the tasklist page'

    gotoTasklistRecat(true)

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')

    then: 'the prisoner start button is locked'
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Automatically referred to Security ($today)")
    summarySection[0].text() == 'Review and categorisation'
    summarySection[1].text() == 'Tasks not yet complete'
  }

  def gotoTasklistRecat(transferToSecurity = false) {
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])

    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', transferToSecurity)
    to TasklistRecatPage, '12'
  }
}
