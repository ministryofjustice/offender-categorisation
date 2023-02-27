package uk.gov.justice.digital.hmpps.cattool.pages;

class CategoriserSecurityInputPage extends HeaderPage {

  static String bookingId

  static url = '/form/ratings/securityInput/' + bookingId

  static at = {
    headingText == 'Security information'
  }

  static content = {
    warningTextDiv { $('div.govuk-warning-text')}
    saveButton { $('button.govuk-button') }
    securityRadio { $('input', name: 'securityInputNeeded') }
    securityText{ $('textarea', name: 'securityInputNeededText') }
  }
}
