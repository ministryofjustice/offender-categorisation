package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserSubmittedPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.ReviewRecatPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class ReviewSpecification extends AbstractSpecification {

  def "The recat review page can be displayed and submitted with security input"() {
    given: 'data has been entered for the pages'

    db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', JsonOutput.toJson([
      recat   : [
        decision            : [category: "C"],
        oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
        higherSecurityReview: [steps: "step", transfer: "No", behaviour: "good", conditions: "conditions"],
        securityBack        : [:],
        securityInput       : [
          securityInputNeeded    : "Yes",
          securityNoteNeeded: "Yes",
          securityInputNeededText: "reasons"
        ],
        prisonerBackground  : [offenceDetails: "offence Details text"],
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
    checkAndSubmitLink.displayed

    when: 'The continue link is selected'
    alertsApi.stubGetEscapeAlerts('B2345YZ', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()

    then: 'the review page is displayed with the saved form details and securityBack link enabled'
    at ReviewRecatPage
    headerValue*.text() == fixture.FULL_HEADER
    changeLinks.size() == 13

    prisonerBackgroundSummary*.text() == [
      'Age 21',
      'Categorisation date Category decision Review location\n24/03/2013 B LPI prison\n08/06/2012 A LPI prison',
      'This person has not been reported as the perpetrator in any assaults in custody before',
      'This person is considered an escape risk\nE-List: 2025-01-01\nEscape Risk Alert: 2025-01-01',
      'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.',
      'offence Details text']
    securityInputSummary*.text() == ['No', 'Yes', 'No', 'Here is the Security information held on this prisoner']
    riskAssessmentSummary*.text() == ['lower security category text', 'higher security category text', 'Yes\nother relevant information']
    higherSecurityReviewSummary*.text() == ['good', 'step', 'No', 'conditions']
    nextReviewDateSummary*.text() == ['Saturday 14 December 2019']

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
    json.contains '"escapeProfile": {"riskType": "ESCAPE", "activeEscapeList": true, "activeEscapeRisk": true, "escapeListAlerts": [{"alertCode": "XEL", "dateCreated": "2025-01-01"}], "escapeRiskAlerts": [{"alertCode": "XER", "dateCreated": "2025-01-01"}]}'
    json.contains '"violenceProfile": {"nomsId": "B2345YZ", "riskType": "VIOLENCE", "displayAssaults": false, "numberOfAssaults": 5, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 2, "provisionalCategorisation": "C", "numberOfNonSeriousAssaults": 3, "veryHighRiskViolentOffender": false}'
    json.contains '"extremismProfile": {}'
  }

  def "The recat review page can be displayed without security input"() {
    given: 'data has been entered for the pages'
    db.createDataWithStatusAndCatType(12, 'STARTED', JsonOutput.toJson([
      recat: [
        decision          : [category: "C"],
        oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
        securityInput     : [securityInputNeeded: "Yes", securityNoteNeeded: "No"],
        nextReviewDate    : [date: "14/12/2019"],
        prisonerBackground: [offenceDetails: "offence Details text"],
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
    alertsApi.stubGetEscapeAlerts('B2345YZ', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()

    then: 'the review page is displayed with manual security link enabled'
    at ReviewRecatPage
    changeLinks.size() == 12
    changeLinks.filter(href: contains('/form/recat/securityInput/'))*.displayed
    securityInputSummary*.text() == ['No', 'Yes', 'No']
  }

  def "The recat review page security flagged section"() {
    given: 'data has been entered for the pages'
    db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', JsonOutput.toJson([
      recat   : [
        decision          : [category: "C"],
        oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
        securityBack      : [:],
        nextReviewDate    : [date: "14/12/2019"],
        prisonerBackground: [offenceDetails: "offence Details text"],
        riskAssessment    : [
          lowerCategory    : "lower security category text",
          otherRelevant    : "Yes",
          higherCategory   : "higher security category text",
          otherRelevantText: "other relevant information"
        ]
      ],
      security: [review: [securityReview: "security info text"]]
    ]), 'RECAT')
    when: 'The review page is displayed for a fully completed set of pages'
    fixture.gotoTasklistRecat()
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    at TasklistRecatPage
    alertsApi.stubGetEscapeAlerts('B2345YZ', true, true)
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    elite2Api.stubAgencyDetails('LPI')
    continueButton.click()

    then: 'the review page is displayed with security flagged showing as "yes"'
    at ReviewRecatPage
    changeLinks.size() == 9
    securityInputSummary*.text() == ['No', 'No', 'Yes', 'security info text']
  }
}
