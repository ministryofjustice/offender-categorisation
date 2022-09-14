package uk.gov.justice.digital.hmpps.cattool.specs.ratings


import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserEscapePage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class EscapeSpecification extends AbstractSpecification {

  def "The escape page displays an alert and extra question when the offender is on the escape list"() {
    when: 'I go to the escape page'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, false)

    escapeButton.click()

    then: 'The page is displayed with alert info and extra question'
    at(new CategoriserEscapePage(bookingId: '12'))

    warningTextDiv.text().contains('This person is considered an escape risk')
    !info.displayed
    alertInfo*.text() == [
      'E-List: First xel comment 2016-09-14',
      '''E-List: Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text 2016-09-15 (expired) (inactive)''',
      'Escape Risk Alert: First xer comment 2016-09-16']
    $('form').text() contains 'Do you think this information means they should be in Cat B?'
  }

  def "The escape page displays an info message when the offender is not on the escape list"() {
    when: 'I go to the escape page'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)

    escapeButton.click()

    then: 'The page is displayed with alert info and extra question'
    at(new CategoriserEscapePage(bookingId: '12'))

    info.text(). contains 'This person is not on the E-List and does not have an Escape Risk Alert'
    !warningTextDiv.displayed
  }

  def "The escape page can be edited"() {
    given: 'the escape page has been completed'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, true)

    escapeButton.click()

    at(new CategoriserEscapePage(bookingId: '12'))
    escapeOtherEvidenceRadio = 'No'
    escapeCatBRadio = 'Yes'
    escapeCatBTextarea << 'Explanation'
    saveButton.click()

    at(new TasklistPage(bookingId: '12'))

    when: 'The edit link is selected'

    escapeButton.click()

    then: 'the escape page is displayed with the saved form details'

    at(new CategoriserEscapePage(bookingId: '12'))

    escapeOtherEvidenceRadio == 'No'
    escapeCatBRadio == 'Yes'
    escapeCatBTextarea.text() == 'Explanation'

    and: "The page is saved"
    saveButton.click()

    then: 'the tasklist is displayed and the status is STARTED'

    at(new TasklistPage(bookingId: '12'))

    db.getData(12).status == ["STARTED"]

  }

  def "Validation with alerts"() {
    when: 'the escape page is submitted when nothing has been entered'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', true, false)

    escapeButton.click()

    at(new CategoriserEscapePage(bookingId: '12'))
    saveButton.click()

    then:
    errorSummaries*.text() == ['Please select yes or no', 'Please select yes or no']
    //errors*.text() == ['Error:\nPlease select yes or no', 'Error:\nPlease select yes or no']

    when: 'the escape page is submitted with no reason text'
    escapeOtherEvidenceRadio = 'Yes'
    escapeCatBRadio = 'Yes'
    saveButton.click()

    then:
    errorSummaries*.text() == ['Please enter details explaining cat B', 'Please enter details of escape risk evidence']
    errors*.text() == ['Error:\nPlease enter details explaining your answer', 'Error:\nPlease provide details']
  }

  def "Validation without alerts"() {
    when: 'the escape page is submitted when nothing has been entered'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubGetEscapeProfile('B2345YZ', 'C', false, false)

    escapeButton.click()

    at(new CategoriserEscapePage(bookingId: '12'))
    saveButton.click()

    then: 'radio errors are shown'
    errorSummaries*.text() == ['Please select yes or no']
    //errors*.text() == ['Error:\nPlease select yes or no']

    when: 'the escape page is submitted with no reason text'
    escapeOtherEvidenceRadio = 'Yes'
    saveButton.click()

    then: 'textarea errors are shown'
    errorSummaries*.text() == ['Please enter details of escape risk evidence']
    errors*.text() == ['Error:\nPlease provide details']

    when: 'the escape page is submitted with reason text'
    escapeOtherEvidenceTextarea << 'Details'
    saveButton.click()

    then: 'submit succeeds'
    at(new TasklistPage(bookingId: '12'))
  }
}
