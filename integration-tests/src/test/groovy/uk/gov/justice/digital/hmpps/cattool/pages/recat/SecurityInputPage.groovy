package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class SecurityInputPage extends HeaderPage {

  static String bookingId

  static url = '/form/recat/securityInput/' + bookingId

  static at = {
    headingText == 'Security information'
  }

  static content = {
    warningTextDiv { $('div.govuk-warning-text')}
    saveButton { $('button.govuk-button') }
    securityRadio { $('input', name: 'securityNoteNeeded') }
    securityText{ $('textarea', name: 'securityInputNeededText') }
    securityNeeded { $('input', name: 'securityInputNeeded') }
  }
}
