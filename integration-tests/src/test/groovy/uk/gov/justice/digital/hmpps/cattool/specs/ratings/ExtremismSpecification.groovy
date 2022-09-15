package uk.gov.justice.digital.hmpps.cattool.specs.ratings


import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.ExtremismPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class ExtremismSpecification extends AbstractSpecification {

  def "The extremism page saves details correctly"() {
    when: 'I go to the extremism page'
    fixture.gotoTasklist()

    at TasklistPage

    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', true, false)
    extremismButton.click()

    then: 'The extremism page is displayed'
    at ExtremismPage
    warningMessage.text() contains 'This person is at risk of engaging in, or vulnerable to, extremism'
    !info.displayed
    !previousTerrorismOffencesText.displayed

    when: 'Details are entered, saved and accessed'
    previousTerrorismOffencesYes.click()
    previousTerrorismOffencesText << "Some risk text"
    submitButton.click()
    at TasklistPage
    extremismButton.click()
    at ExtremismPage

    then: "data is correctly retrieved"
    form.previousTerrorismOffences == "Yes"
    form.previousTerrorismOffencesText == "Some risk text"
    db.getData(12).status == ["STARTED"]
  }

  def "The extremism page correctly shows an info message when not increased risk"() {
    when: 'I go to the extremism page'
    fixture.gotoTasklist()
    at TasklistPage

    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false)
    //to ExtremismPage, '12'
    extremismButton.click()

    then: 'The extremism page is displayed'
    at ExtremismPage
    info.text() contains 'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.'
    !warningMessage.displayed
  }

  def 'Validation test'() {
    db.createData(12, '{}')

    when: 'I submit the page with empty details'
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-3).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11,date12])
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12)
    riskProfilerApi.stubGetExtremismProfile('B2345YZ', 'C', false, false)
    to ExtremismPage, '12'
    submitButton.click()

    then: 'I stay on the page with radio button validation errors'
    at ExtremismPage
    errorSummaries*.text() == ['Please select yes or no']
    waitFor(20) {
      errors*.text() == ['Error:\nPlease select yes or no']
    }

    when: 'I click yes but fail to add details'
    previousTerrorismOffencesYes.click()
    submitButton.click()

    then: 'I stay on the page with textarea validation errors'
    waitfor {
      errorSummaries*.text() == ['Please enter the previous offences']
      errors*.text() == ['Error:\nPlease enter details']
    }
  }
}
