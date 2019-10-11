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
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackCancelledPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackConfirmationPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackEligibilityPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackProgressPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.FasttrackRemainPage

import java.time.LocalDate

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

  def "Happy path with validation"() {
    when: ''
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    go 'form/recat/fasttrackEligibility/12'

    then: ''

    at FasttrackEligibilityPage

    when: 'submitted without answers'

    submitButton.click()

    then: 'presented with validation message'

    errorSummaries*.text() == ['Please enter yes or no', 'Please enter yes or no']
    errors*.text() == ['Error:\nPlease select yes or no', 'Error:\nPlease select yes or no']

    when: 'form is submitted complete'

    earlyCatDNo.click()

    increaseCategoryNo.click()

    submitButton.click()

    then: 'Progress to next page'

    at FasttrackRemainPage

    when: 'submitted without answers'

    submitButton.click()

    then: 'presented with validation message'

    errorSummaries*.text() == ['Please enter yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'form is submitted complete'

    remainYes.click()

    submitButton.click()

    then: 'user is presented with the Progress page'

    at FasttrackProgressPage

    when: 'submitted without answers'

    submitButton.click()

    then: 'presented with validation message'

    errorSummaries*.text() == ['Please enter details']
    errors*.text() == ['Error:\nPlease enter details']

    when: 'form is submitted complete'

    progressText = 'something'

    submitButton.click()

    then: 'User is presented with the confirmation page'

    at FasttrackConfirmationPage

    when: 'continue is selected'

    submitButton.click()

    then: 'user is returned to the recat task list'

    at TasklistRecatPage

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    def calculatedNextReviewDate = LocalDate.now().plusYears(1).format('dd/MM/yyy')
    response.recat == [
      decision:[category:'C'],
      nextReviewDate:[date: calculatedNextReviewDate],
      riskAssessment:[lowerCategory:'They could not be considered for open conditions early. Their circumstances weren\'t exceptional enough.',
      otherRelevant:'No',
      higherCategory:'They pose no additional risks. There’s no reason to consider them for higher security conditions.'],
      fasttrackRemain:[remainCatC:'Yes'],
      fasttrackEligibility:[earlyCatD:'No', increaseCategory:'No'],
      fasttrackProgress:[progressText:'something'],
      securityInput: [securityInputNeeded:'No']]
  }

  def "leave fast track at eligibility"() {
    given: ''
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    go 'form/recat/fasttrackEligibility/12'

    at FasttrackEligibilityPage

    when: 'user answers negatively'

    earlyCatDYes.click()

    increaseCategoryYes.click()

    submitButton.click()

    then: 'user is presented with the fast track is not suitable page'

    at FasttrackCancelledPage

    when: 'the user clicks continue'

    submitButton.click()

    then: 'They are returned to the recat task list'

    at TasklistRecatPage

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.recat == [fasttrackEligibility: [earlyCatD:'Yes', increaseCategory:'Yes']]

  }

  def "leave fast track at remain category C"() {

    given : 'user progresses to the Remain in Category C page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    go 'form/recat/fasttrackEligibility/12'

    at FasttrackEligibilityPage

    earlyCatDNo.click()

    increaseCategoryNo.click()

    submitButton.click()

    at FasttrackRemainPage

    when: 'user answers negatively'

    remainNo.click()

    submitButton.click()

    then: 'user is presented with the fast track is not suitable page'

    at FasttrackCancelledPage

    when: 'the user clicks continue'

    submitButton.click()

    then: 'They are returned to the recat task list'

    at TasklistRecatPage

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    response.recat == [fasttrackEligibility: [earlyCatD:'No', increaseCategory:'No'], fasttrackRemain: [remainCatC:'No']]
  }


}
