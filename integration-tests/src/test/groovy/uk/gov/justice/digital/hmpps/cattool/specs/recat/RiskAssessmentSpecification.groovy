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
    riskAssessmentLink.click()

    then: 'The page is displayed'
    at RiskAssessmentPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Details are entered, saved and accessed'
    lowerCategory << 'lower category text'
    higherCategory << 'higher category text'
    otherRelevantYes.click()
    otherRelevantText << 'other relevant text'
    submitButton.click()
    at TasklistRecatPage
    riskAssessmentLink.click()
    at RiskAssessmentPage

    then: "data is correctly retrieved"
    lowerCategory == 'lower category text'
    higherCategory == 'higher category text'
    form.otherRelevant == "Yes"
    otherRelevantText == 'other relevant text'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [riskAssessment: [lowerCategory: 'lower category text', higherCategory: 'higher category text', otherRelevant: 'Yes', otherRelevantText: 'other relevant text']]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    riskAssessmentLink.click()

    at RiskAssessmentPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at RiskAssessmentPage
    waitFor {
      errorSummaries*.text() == ['Please enter lower security category details', 'Please enter higher security category details', 'Please select yes or no']
      errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease select yes or no']
    }

    when: 'I click yes but fail to add details'
    otherRelevantYes.click()
    submitButton.click()

    then: 'I stay on the page with an additional textarea validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter lower security category details', 'Please enter higher security category details', 'Please enter other relevant information']
      errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details']
    }
  }
}
