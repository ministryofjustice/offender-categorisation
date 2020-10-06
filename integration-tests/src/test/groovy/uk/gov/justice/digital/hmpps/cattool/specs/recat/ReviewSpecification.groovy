package uk.gov.justice.digital.hmpps.cattool.specs.recat

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.interaction.InteractionsSupport
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
        decision            : [category: "C"],
        higherSecurityReview: [steps: "step", transfer: "No", behaviour: "good", conditions: "conditions"],
        securityBack        : [:],
        securityInput       : [
          securityInputNeeded    : "Yes",
          securityInputNeededText: "reasons"
        ],
        prisonerBackground  : [offenceDetails: "some text"],
        nextReviewDate      : [date: "14/12/2019"],
        riskAssessment      : [
          lowerCategory    : "lower security category text",
          otherRelevant    : "Yes",
          higherCategory   : "higher security category text",
          otherRelevantText: "other relevant information"
        ]
      ],
      security: [review: [securityReview: 'Here is the Security information held on this prisoner']]
    ]), 'RECAT')
    db.createReviewReason(12, 'AGE')

    when: 'The task list is displayed for a fully completed set of forms'
    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')

    then: 'the completed text is displayed'
    summarySection[0].text() == 'Check and submit'
    summarySection[1].text() == 'All tasks completed'

    when: 'The continue link is selected'
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, true, false)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()

    then: 'the review page is displayed with the saved form details and securityBack link enabled'
    at ReviewRecatPage
    headerValue*.text() == fixture.FULL_HEADER
    changeLinks.size() == 5

    prisonerBackgroundSummary*.text() == [
      '',
      'Age 21',
      'Categorisation date Category decision Review location\n24/03/2013 B LPI prison\n08/06/2012 A LPI prison',
      'This person has not been reported as the perpetrator in any assaults in custody before',
      'This person is considered an escape risk\nE-List: First xel comment 2016-09-14\nE-List: Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text 2016-09-15 (expired) (inactive)\nEscape Risk Alert: First xer comment 2016-09-16',
      'This person is at risk of engaging in, or vulnerable to, extremism.',
      'some text']
    securityInputSummary*.text() == ['', 'No', 'Yes', 'No', 'Here is the Security information held on this prisoner']
    riskAssessmentSummary*.text() == ['', 'lower security category text', 'higher security category text', 'Yes\nother relevant information']
    assessmentSummary*.text() == ['', 'Category C']
    higherSecurityReviewSummary*.text() == ['', 'good', 'step', 'No', 'conditions']
    nextReviewDateSummary*.text() == ['', 'Saturday 14th December 2019']

    !changeLinks.filter(href: contains('/form/recat/securityInput/')).displayed
    when: 'The page is submitted'
    elite2Api.stubCategorise('C', '2019-12-14')
    submitButton.click()

    then: 'Submission is successful and nomis is updated'
    at CategoriserSubmittedPage // bit of a cheat - pages are currently identical!

    def data = db.getData(12)[0]
    def riskProfile = data.risk_profile
    data.nomis_sequence_no == 4
    def json = riskProfile.toString()
    json.contains '"socProfile": {"nomsId": "B2345YZ", "riskType": "SOC", "transferToSecurity": false'
    json.contains '"escapeProfile": {"nomsId": "B2345YZ", "riskType": "ESCAPE", "activeEscapeList": true, "activeEscapeRisk": true,'
    json.contains '"violenceProfile": {"nomsId": "B2345YZ", "riskType": "VIOLENCE", "displayAssaults": false, "numberOfAssaults": 5, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 2, "provisionalCategorisation": "C", "numberOfNonSeriousAssaults": 3, "veryHighRiskViolentOffender": false}'
    json.contains '"extremismProfile": {"nomsId": "B2345YZ", "riskType": "EXTREMISM", "notifyRegionalCTLead": true, "increasedRiskOfExtremism": true, "provisionalCategorisation": "C"}'
  }

  def "The recat review page can be displayed without security input"() {
    given: 'data has been entered for the pages'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([
      recat: [
        decision          : [category: "C"],
        securityInput     : [securityInputNeeded: "No"],
        nextReviewDate    : [date: "14/12/2019"],
        prisonerBackground: [offenceDetails: "some text"],
        riskAssessment    : [
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
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, true, false)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()

    then: 'the review page is displayed with manual security link enabled'
    at ReviewRecatPage
    changeLinks.size() == 5
    changeLinks.filter(href: contains('/form/recat/securityInput/')).displayed
    securityInputSummary*.text() == ['', 'No', 'No', 'No']
  }

  def "The recat review page security flagged section"() {
    given: 'data has been entered for the pages'
    db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', JsonOutput.toJson([
      recat   : [
        decision          : [category: "C"],
        securityBack      : [:],
        nextReviewDate    : [date: "14/12/2019"],
        prisonerBackground: [offenceDetails: "some text"],
        riskAssessment    : [
          lowerCategory    : "lower security category text",
          otherRelevant    : "Yes",
          higherCategory   : "higher security category text",
          otherRelevantText: "other relevant information"
        ]
      ],
      security: [review: [securityReview: "security info"]]
    ]), 'RECAT')
    when: 'The review page is displayed for a fully completed set of pages'
    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, true, false)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()

    then: 'the review page is displayed with security flagged showing as "yes"'
    at ReviewRecatPage
    changeLinks.size() == 4
    securityInputSummary*.text() == ['', 'No', 'No', 'Yes', 'security info']
  }
}
