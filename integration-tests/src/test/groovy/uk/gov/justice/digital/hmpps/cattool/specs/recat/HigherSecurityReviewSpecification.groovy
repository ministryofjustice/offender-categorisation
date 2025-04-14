package uk.gov.justice.digital.hmpps.cattool.specs.recat


import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.HigherSecurityReviewPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class HigherSecurityReviewSpecification extends AbstractSpecification {

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    // higherSecurityReviewButton.click()
    to HigherSecurityReviewPage, '12'

    at HigherSecurityReviewPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    waitFor { at HigherSecurityReviewPage }
    waitFor {
      errorSummaries*.text() == ['Please enter behaviour details', 'Please enter steps details', 'Please select yes or no', 'Please enter security conditions details']
    }
    waitFor {
      errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease select yes or no', 'Error:\nPlease enter details']
    }

    when: 'I click no but fail to add details'
    transferNo.click()
    submitButton.click()

    then: 'I stay on the page with an additional textarea validation error'
    waitFor {
      errorSummaries*.text() == ['Please enter behaviour details', 'Please enter steps details', 'Please enter transfer details', 'Please enter security conditions details']
    }
    waitFor {
      errors*.text() == ['Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details', 'Error:\nPlease enter details']
    }
  }
}
