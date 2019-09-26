package uk.gov.justice.digital.hmpps.cattool.specs.recat

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonSlurper
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackConfirmationPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackEligibilityPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackPositivePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackRemainPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.PrisonerBackgroundPage

class FasttrackCSpecification extends GebReportingSpec {

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  def setup() {
    db.clearDb()
  }

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "Happy path - fast track"() {
    when: ''
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    go 'form/recat/fasttrackEligibility/12'

    then: ''

    at FasttrackEligibilityPage

    when: ''

    earlyCatDNo.click()

    increaseCategoryNo.click()

    submitButton.click()

    then: ''

    at FasttrackRemainPage

    when: ''

    remainYes.click()

    submitButton.click()

    then: ''

    at FasttrackPositivePage

    when: ''

    positiveYes.click()

    positiveText = 'something'

    submitButton.click()

    then: ''

    at FasttrackConfirmationPage

    when: ''

    submitButton.click()

    then: ''

    at TasklistRecatPage


  }

}
