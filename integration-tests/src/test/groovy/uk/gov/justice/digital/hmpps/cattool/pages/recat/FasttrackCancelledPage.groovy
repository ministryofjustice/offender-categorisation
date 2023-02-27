package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class FasttrackCancelledPage extends HeaderPage {

  static url = '/form/recat/fasttrackCancelled'

  static at = {
    headingText == 'You need to do a complete category review'
  }

  static content = {
    submitButton { $('a.govuk-button') }

  }
}
