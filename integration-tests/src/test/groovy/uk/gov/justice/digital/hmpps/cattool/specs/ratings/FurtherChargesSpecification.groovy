package uk.gov.justice.digital.hmpps.cattool.specs.ratings


import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.CategoriserFurtherChargesPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class FurtherChargesSpecification extends AbstractSpecification {

  def "The further charges page is shown correctly"() {
    given: 'I am at the further charges page'

    fixture.gotoTasklist()
    at new TasklistPage(bookingId: '12')
    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    furtherChargesButton.click()
    at new CategoriserFurtherChargesPage(bookingId: '12')

    when: 'An empty form is submitted'
    saveButton.click()

    then: 'There is a validation error'
    errorSummaries*.text() == ['Please select yes or no']
    errors*.text() == ['Error:\nPlease select yes or no']

    when: 'Some data is saved and accessed'
    furtherChargesYes.click()
    furtherChargesCatBYes.click()
    furtherChargesText << "There are further charges"
    saveButton.click()
    at TasklistPage
    furtherChargesButton.click()

    then: "data is correctly retrieved"
    at new CategoriserFurtherChargesPage(bookingId: '12')
    form.furtherChargesText == "There are further charges"
    form.furtherCharges == "Yes"
    db.getData(12).status == ["STARTED"]
  }
}
