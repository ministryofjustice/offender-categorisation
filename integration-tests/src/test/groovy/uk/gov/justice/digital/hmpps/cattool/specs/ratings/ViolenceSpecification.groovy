package uk.gov.justice.digital.hmpps.cattool.specs.ratings


import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.ViolencePage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class ViolenceSpecification extends AbstractSpecification {

  def "The violence page saves details correctly"() {
    when: 'I go to the violence page'
    fixture.gotoTasklist()
    at TasklistPage
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    violenceButton.click()

    then: 'The violence page is displayed'
    at ViolencePage
    info.text() contains 'This person has not been reported as the perpetrator in any assaults in custody before.'
    !warning.displayed
    !highRiskOfViolenceText.displayed
    !seriousThreatText.displayed

    when: 'Details are entered, saved and accessed'
    highRiskOfViolenceYes.click()
    highRiskOfViolenceText << "Some risk text"
    seriousThreatYes.click()
    seriousThreatText << "Some threat text"
    submitButton.click()
    at TasklistPage
    to ViolencePage, '12'

    then: "data is correctly retrieved"
    form.highRiskOfViolence == "Yes"
    form.highRiskOfViolenceText == "Some risk text"
    form.seriousThreat == "Yes"
    form.seriousThreatText == "Some threat text"
    db.getData(12).status == ["STARTED"]
  }

  def "The violence page shows warning correctly"() {
    when: 'I go to the violence page'
    fixture.gotoTasklist()
    at TasklistPage
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, true)
    violenceButton.click()

    then: 'The violence page is displayed with a warning'
    at ViolencePage
    warning.text() contains 'This person has been reported as the perpetrator in 5 assaults in custody before, including 2 serious assaults and 3 non-serious assaults in the past 12 months'
    !info.displayed

    when: 'The risk profiler returns the safer custody lead flag'
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, true, false)
    to ViolencePage, '12'

    then: 'The violence page is displayed with the safer custody lead message'
    at ViolencePage
    waitFor {
      warning.text() contains 'Please notify your safer custody lead about this prisoner'
      !info.displayed
    }
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklist()
    riskProfilerApi.stubGetViolenceProfile('B2345YZ', 'C', false, false, false)
    at TasklistPage
    violenceButton.click()
    at ViolencePage
    submitButton.click()

    then: 'I stay on the page with radio button validation errors'
    at ViolencePage
    waitFor(10) {
      errorSummaries*.text() == ['High risk of violence: please select yes or no',
                                 'Serious Threat: Please select yes or no']
      errors*.text() == ['Error:\nPlease select yes or no',
                         'Error:\nPlease select yes or no']
    }

    when: 'I click yes but fail to add details'
    highRiskOfViolenceYes.click()
    seriousThreatYes.click()
    submitButton.click()

    then: 'I stay on the page with textarea validation errors'
    waitFor(10) {
      errorSummaries*.text() == ['Please enter high risk of violence details',
                                 'Please enter serious threat details']
      errors*.text() == ['Error:\nPlease enter details',
                         'Error:\nPlease enter details']
    }
  }
}
