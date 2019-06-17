package uk.gov.justice.digital.hmpps.cattool.specs.recat

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
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSubmittedPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ReviewRecatPage

class ReviewSpecification extends GebReportingSpec {

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


  def "The recat review page can be displayed and submitted with security input"() {
    given: 'data has been entered for the pages'

    db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', JsonOutput.toJson([
      recat   : [
        decision      : [category: "C"],
        securityBack  : [:],
        securityInput : [
          securityInputNeeded    : "Yes",
          securityInputNeededText: "reasons"
        ],
        nextReviewDate: [date: "14/12/2019"],
        riskAssessment: [
          lowerCategory    : "lower security category text",
          otherRelevant    : "Yes",
          higherCategory   : "higher security category text",
          otherRelevantText: "other relevant information"
        ]
      ],
      security: [review: [securityReview: 'Here is the Security information held on this prisoner']]
    ]), 'RECAT')

    when: 'The task list is displayed for a fully completed set of forms'
    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')

    then: 'the completed text is displayed'
    summarySection[0].text() == 'Check and submit'
    summarySection[1].text() == 'Completed'

    when: 'The continue link is selected'
    continueButton.click()

    then: 'the review page is displayed with the saved form details and securityBack link enabled'
    at ReviewRecatPage
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

    changeLinks.size() == 4
    // prisonerBackgroundSummary*.text() == ['TBC']
    securityInputSummary*.text() == ['', 'No', 'Yes', 'Here is the Security information held on this prisoner']
    riskAssessmentSummary*.text() == ['', 'lower security category text', 'higher security category text', 'Yes\nother relevant information']
    assessmentSummary*.text() == ['', 'Category C']
    nextReviewDateSummary*.text() == ['', 'Saturday 14th December 2019']

    !changeLinks.filter(href: contains('/form/recat/securityInput/')).displayed
    when: 'The page is submitted'
    elite2Api.stubCategorise('C', '2019-12-14')
    submitButton.click()

    then:'Submission is successful and nomis is updated'
    at CategoriserSubmittedPage // bit of a cheat - pages are currently identical!
  }

  def "The recat review page can be displayed without security input"() {
    given: 'data has been entered for the pages'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([
      recat: [
        decision      : [category: "C"],
        securityInput : [securityInputNeeded: "No"],
        nextReviewDate: [date: "14/12/2019"],
        riskAssessment: [
          lowerCategory    : "lower security category text",
          otherRelevant    : "Yes",
          higherCategory   : "higher security category text",
          otherRelevantText: "other relevant information"
        ]
      ]
    ]), 'RECAT')
    when: 'The review page is displayed for a fully completed set of pages'
    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    continueButton.click()

    then: 'the review page is displayed with manual security link enabled'
    at ReviewRecatPage
    changeLinks.size() == 5
    changeLinks.filter(href: contains('/form/recat/securityInput/')).displayed
  }
}
