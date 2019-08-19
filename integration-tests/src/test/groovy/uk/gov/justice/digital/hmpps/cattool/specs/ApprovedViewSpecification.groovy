package uk.gov.justice.digital.hmpps.cattool.specs

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.ApprovedViewPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class ApprovedViewSpecification extends GebReportingSpec {

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

  def "The approved view page is correctly displayed (suggested Cat)"() {

    when: 'the approved view page for B2345YZ is selected'
    db.createDataWithStatus(12, 'APPROVED', JsonOutput.toJson([
      categoriser: [provisionalCategory: [suggestedCategory: "C", categoryAppropriate: "Yes"]],
      supervisor : [review: [supervisorCategoryAppropriate: "Yes"]]
    ]))
    navigateToView()

    then: 'the cat details are correct'
    headerValue*.text() == fixture.FULL_HEADER
    categories*.text() == ['C\nWarning\nCategory C',
                           'C\nWarning\nThe categoriser recommends category C',
                           'C\nWarning\nThe supervisor also recommends category C']
    !comments.displayed
    comments.size() == 0
    !openConditionsHeader.isDisplayed()
    // NOTE reviewContents.html is tested by ReviewSpecification
  }

  def "The approved view page is correctly displayed (Cat overridden by categoriser and supervisor)"() {

    when: 'the approved view page for B2345YZ is selected'
    db.createDataWithStatus(12, 'APPROVED', JsonOutput.toJson([
      categoriser: [provisionalCategory: [suggestedCategory     : "B", categoryAppropriate: "No", overriddenCategory: "C",
                                          overriddenCategoryText: "Here are the categoriser's comments on why the category was changed"]],
      supervisor : [review: [supervisorCategoryAppropriate   : "No", supervisorOverriddenCategory: "D",
                             supervisorOverriddenCategoryText: "Here are the supervisor's comments on why the category was changed"]],
      openConditions: [riskLevels: [likelyToAbscond: "No"], riskOfHarm: [seriousHarm: "No"], foreignNational: [isForeignNational: "No"], earliestReleaseDate: [threeOrMoreYears: "No"]]
    ]))
    navigateToView()


    then: 'the cat details are correct'
    categories*.text() == ['D\nWarning\nCategory D',
                           'B\nC\nWarning\nThe recommended category was changed from a B to a C',
                           'C\nD\nWarning\nThe recommended category was changed from a C to a D']
    comments*.text() == ['Here are the categoriser\'s comments on why the category was changed',
                         'Here are the supervisor\'s comments on why the category was changed']

    openConditionsHeader.isDisplayed()

    when: "I click on the button"
    submitButton.click()

    then: "I return to the supervisor done page"
    at SupervisorDonePage
  }

  private navigateToView() {

    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    // 14 days after sentenceStartDate
    elite2Api.stubUncategorisedAwaitingApproval()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    fixture.loginAs(SUPERVISOR_USER)
    at SupervisorHomePage

    elite2Api.stubCategorised([12])
    elite2Api.stubAgencyDetails('LEI')
    doneTabLink.click()
    at SupervisorDonePage

    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false)
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetSocProfile('B2345YZ', 'C', true)
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', true, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)

    viewButtons[0].click()

    at ApprovedViewPage
  }
}
