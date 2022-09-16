package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RiskAssessmentPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class RiskAssessmentSpecification extends AbstractSpecification {

  def "The page saves details correctly"() {
    when: 'I go to the Higher Security Review page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    riskAssessmentButton.click()

    then: 'The page is displayed'
    at RiskAssessmentPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Details are entered, saved and accessed'
    lowerCategory << 'lower text'
    higherCategory << 'higher text'
    otherRelevantYes.click()
    otherRelevantText << 'extra info'
    submitButton.click()
    at TasklistRecatPage
    riskAssessmentButton.click()
    at RiskAssessmentPage

    then: "data is correctly retrieved"
    lowerCategory == 'lower text'
    higherCategory == 'higher text'
    form.otherRelevant == "Yes"
    otherRelevantText == 'extra info'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [riskAssessment: [lowerCategory: 'lower text', higherCategory: 'higher text', otherRelevant: 'Yes', otherRelevantText: 'extra info']]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    riskAssessmentButton.click()

    at RiskAssessmentPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at RiskAssessmentPage
    errorSummaries*.text() == ['Please enter lower security category details', 'Please enter higher security category details', 'Please select yes or no']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease select yes or no']


    when: 'I click yes but fail to add details'
    otherRelevantYes.click()
    submitButton.click()

    then: 'I stay on the page with an additional textarea validation error'
    errorSummaries*.text() == ['Please enter lower security category details', 'Please enter higher security category details', 'Please enter other relevant information']
    errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details']
  }
}
