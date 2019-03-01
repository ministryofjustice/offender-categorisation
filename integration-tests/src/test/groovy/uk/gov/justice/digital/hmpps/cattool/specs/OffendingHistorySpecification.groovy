package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class OffendingHistorySpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)

  def "The Offending history page is shown correctly"() {
    when: 'I go to the Offending history page'

    fixture.gotoTasklist()
    at(new CategoriserTasklistPage(bookingId: '12'))
    elite2api.stubAssessments(['B2345YZ'])
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2api.stubOffenceHistory('B2345YZ')
    offendingHistoryButton.click()

    then: 'a Cat A warning and offence history is displayed'
    at(new CategoriserOffendingHistoryPage(bookingId: '12'))
    catAWarning.text().contains('This offender was categorised as a Cat A in 2012 until 2013 for a previous sentence and released as a Cat B in 2014')
    history*.text() == ['Libel (21/02/2019)', 'Slander (22/02/2019 - 24/02/2019)']
  }
}
