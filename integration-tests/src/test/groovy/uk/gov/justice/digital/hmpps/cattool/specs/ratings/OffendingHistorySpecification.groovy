package uk.gov.justice.digital.hmpps.cattool.specs.ratings


import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserOffendingHistoryPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class OffendingHistorySpecification extends AbstractSpecification {

  def "The Offending history page is shown correctly for a previous cat A"() {
    when: 'I go to the Offending history page'

    fixture.gotoTasklist()
    at new TasklistPage(bookingId: '12')
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    offendingHistoryButton.click()

    then: 'a Cat A warning and offence history is displayed'
    at new CategoriserOffendingHistoryPage(bookingId: '12')
    catAWarning.text() endsWith 'This prisoner was categorised as Cat A in 2012 until 2013 for a previous sentence and released as a Cat B in 2014'
    !catAInfo.displayed
    history*.text() == ['Libel (21/02/2019)', 'Slander (22/02/2019 - 24/02/2019)', 'Undated offence']

    when: 'An empty form is submitted'
    saveButton.click()

    then: 'There is a validation error'
    errorSummaries*.text() == ['Please select yes or no']
    errors.text().toString() == "Error:\nPlease select yes or no"


    when: 'Some data is saved and accessed'
    previousConvictionsYes.click()
    previousConvictionsText << "some convictions details"
    saveButton.click()
    at TasklistPage
    offendingHistoryButton.click()

    then: "data is correctly retrieved"
    at new CategoriserOffendingHistoryPage(bookingId: '12')
    form.previousConvictionsText == "some convictions details"
    form.previousConvictions == "Yes"
    db.getData(12).status == ["STARTED"]
  }

  def "The Offending history page is shown correctly (no previous cat A)"() {
    when: 'I go to the Offending history page'

    fixture.gotoTasklist()
    at new TasklistPage(bookingId: '12')
    elite2Api.stubAssessments('B2345YZ', true)
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    offendingHistoryButton.click()

    then: 'a non Cat A info message is displayed'
    at new CategoriserOffendingHistoryPage(bookingId: '12')
    catAInfo.text() endsWith 'This person has not been categorised as Cat A, restricted or a provisional Cat A before.'
    !catAWarning.displayed
  }

  def "The Offending history page is shown correctly (cat A in current booking)"() {
    when: 'I go to the Offending history page'

    fixture.gotoTasklist()
    at new TasklistPage(bookingId: '12')
    elite2Api.stubAssessmentsWithCurrent('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    elite2Api.stubOffenceHistory('B2345YZ')
    offendingHistoryButton.click()

    then: 'the correct Cat A warning message is displayed'
    at new CategoriserOffendingHistoryPage(bookingId: '12')
    catAWarning.text() endsWith 'This prisoner was categorised as Provisional Cat A in 2018 until 2019'
  }
}
