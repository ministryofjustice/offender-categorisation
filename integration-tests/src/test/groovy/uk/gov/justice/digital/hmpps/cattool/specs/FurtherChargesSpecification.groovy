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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserFurtherChargesPage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserTasklistPage

class FurtherChargesSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def setup() {
    db.clearDb()
  }

  def "The further charges page is shown correctly"() {
    given: 'I am at the further charges page'

    fixture.gotoTasklist()
    at new CategoriserTasklistPage(bookingId: '12')
    elite2api.stubAssessments('B2345YZ')
    elite2api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    furtherChargesButton.click()
    at new CategoriserFurtherChargesPage(bookingId: '12')

    when: 'An empty form is submitted'
    saveButton.click()

    then: 'There is a validation error'
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'Some data is saved and accessed'
    furtherChargesYes.click()
    furtherChargesCatBYes.click()
    furtherChargesText << "There are further charges"
    saveButton.click()
    at CategoriserTasklistPage
    furtherChargesButton.click()

    then: "data is correctly retrieved"
    at new CategoriserFurtherChargesPage(bookingId: '12')
    form.furtherChargesText == "There are further charges"
    form.furtherCharges == "Yes"
    db.getData(12).status == ["STARTED"]
  }
}
