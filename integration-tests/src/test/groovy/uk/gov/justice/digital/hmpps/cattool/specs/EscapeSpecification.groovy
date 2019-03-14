package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserEscapePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage

class EscapeSpecification extends GebReportingSpec {

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

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The escape page displays an alert when the offender is on the escape list"() {
    when: 'I go to the escape page'

    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, false)

    escapeButton.click()

    then: 'The page is displayed with an alert and info'
    at(new CategoriserEscapePage(bookingId: '12'))

    warningTextDiv.text().contains('This person is considered an escape risk')
    alertInfo*.text() == [
      'XEL First xel comment 2016-09-14',
      '''XEL Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text 2016-09-15 (expired) (inactive)''',
      'XER First xer comment 2016-09-16']
  }

  def "The escape page can be edited"() {
    given: 'the escape page has been completed'

    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)

    escapeButton.click()

    at(new CategoriserEscapePage(bookingId: '12'))
    radio = 'No'
    saveButton.click()

    at(new CategoriserTasklistPage(bookingId: '12'))

    when: 'The edit link is selected'

    escapeButton.click()

    then: 'the escape page is displayed with the saved form details'

    at(new CategoriserEscapePage(bookingId: '12'))

    radio == 'No'

    and: "The page is saved"
    saveButton.click()

    then: 'the tasklist is displayed and the status is STARTED'

    at(new CategoriserTasklistPage(bookingId: '12'))

    db.getData(12).status == ["STARTED"]

  }

  def "Validation"() {
    when: 'the escape page is submitted when nothing has been entered'

    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))

    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)

    escapeButton.click()

    at(new CategoriserEscapePage(bookingId: '12'))
    saveButton.click()

    then:
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Please select yes or no']

    when: 'the escape page is submitted with no reason text'
    radio = 'Yes'
    saveButton.click()

    then:
    errorSummaries*.text() == ['Please enter details of these charges']
    errors*.text() == ['Please enter details of these charges']
  }
}
