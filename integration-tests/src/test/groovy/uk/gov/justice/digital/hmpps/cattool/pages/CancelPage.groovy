package uk.gov.justice.digital.hmpps.cattool.pages

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class CancelPage extends HeaderPage {

  static url = '/form/cancel'

  static at = {
    headingText == 'Confirm cancellation'
  }

  static content = {
    confirmYes { $('#confirm') }
    confirmNo { $('#confirm-2') }

    submitButton { $('button.govuk-button') }
  }
}
