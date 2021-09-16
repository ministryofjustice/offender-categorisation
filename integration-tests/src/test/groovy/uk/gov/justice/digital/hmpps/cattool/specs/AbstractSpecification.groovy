package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.AllocationApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture

import java.time.LocalDate

abstract class AbstractSpecification extends GebReportingSpec {

  def setup() {
    db.clearDb()
  }

  @Rule
  protected Elite2Api elite2Api = new Elite2Api()

  @Rule
  protected RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  protected AllocationApi allocationApi = new AllocationApi()

  @Rule
  protected OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  protected TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi, allocationApi)
  protected DatabaseUtils db = new DatabaseUtils()

  static final TODAY = LocalDate.now()
  static final SIX_MONTHS_AHEAD = LocalDate.now().plusMonths(6).format('dd/MM/yyyy')
  private static final threeMonthsAhead = LocalDate.now().plusMonths(3)
  static final THREE_MONTHS_AHEAD = threeMonthsAhead.format('dd/MM/yyyy')
  static final THREE_MONTHS_AHEAD_ISO = threeMonthsAhead.format('yyyy-MM-dd')
  static final THREE_MONTHS_AHEAD_LONG = threeMonthsAhead.format('d MMMM yyyy')
}
