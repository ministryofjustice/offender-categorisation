package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class FasttrackConfirmationPage extends HeaderPage {

  static url = '/form/recat/fasttrackConfirmation'

  static at = {
    headingText == 'This category review has been filled in automatically for you'
  }

  static content = {
    submitButton { $('a.govuk-button') }

  }
}
