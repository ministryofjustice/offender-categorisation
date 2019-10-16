package uk.gov.justice.digital.hmpps.cattool.specs.ratings

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
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.NextReviewDateEditingPage
import uk.gov.justice.digital.hmpps.cattool.pages.NextReviewDatePage
import uk.gov.justice.digital.hmpps.cattool.pages.NextReviewDateQuestionPage

import java.time.LocalDate

class NextReviewDateSpecification extends GebReportingSpec {

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
  static final SIX_MONTHS_AHEAD = LocalDate.now().plusMonths(6).format('dd/MM/yyyy')

  def "The page saves details correctly - 6 months"() {
    when: 'I go to the Next Review Date Question page'
    fixture.gotoTasklist(false)
    at TasklistPage
    nextReviewDateButton.click()

    then: 'The page is displayed'
    at NextReviewDateQuestionPage
    headerValue*.text() == fixture.MINI_HEADER

    when: "6 months is selected"
    sixMonthsOption.click()
    submitButton.click()

    then: "I continue to the Next Review Date page"
    at NextReviewDatePage
    reviewDate.value() == SIX_MONTHS_AHEAD

    when: 'Populated date is used, saved and accessed'
    submitButton.click()
    at TasklistPage
    nextReviewDateButton.click()
    at NextReviewDateEditingPage

    then: "data is correctly populated"
    chosenDate.text() == SIX_MONTHS_AHEAD

    when: "we decide to change the data"
    changeLink.click()
    at NextReviewDateQuestionPage
    specificOption.click()
    submitButton.click()
    at NextReviewDatePage

    then: "data is correctly blanked"
    form.date == ''

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type.value == ['INITIAL']
    response.ratings == [nextReviewDate: [date: SIX_MONTHS_AHEAD]]
    data.user_id == ['CATEGORISER_USER']
    data.assigned_user_id == ['CATEGORISER_USER']
  }

  def "Validation"() {
    when: 'I go to the Next Review Date Question page'
    fixture.gotoTasklist(false)
    at TasklistPage
    nextReviewDateButton.click()

    then: 'The page is displayed'
    at NextReviewDateQuestionPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Nothing is selected - validation kicks in'
    submitButton.click()
    at NextReviewDateQuestionPage

    then: "Error is displayed"
    errorSummaries*.text() == ['Please select a choice']
    errors*.text() == ['Error:\nPlease select a choice']

    when: "specific date is selected"
    specificOption.click()
    submitButton.click()

    then: "I continue to the Next Review Date page"
    at NextReviewDatePage
    reviewDate.value() == ''

    when: 'No date is entered - validation kicks in'
    submitButton.click()
    at NextReviewDatePage

    then: "Error is displayed"
    errorSummaries*.text() == ['Enter a valid date that is after today']
    errors*.text() == ['Error:\nEnter a valid date that is after today']
  }
}
