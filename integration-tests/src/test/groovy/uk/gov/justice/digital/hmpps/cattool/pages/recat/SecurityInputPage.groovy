package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class SecurityInputPage extends Page {

  static String bookingId

  static url = '/form/recat/securityInput/' + bookingId

  static at = {
    headingText == 'Security information'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    backLink { $('a.govuk-back-link') }
    warningTextDiv { $('div.govuk-warning-text')}
    saveButton { $('button.govuk-button') }
    securityRadio { $('input', name: 'securityInputNeeded') }
    securityText{ $('textarea', name: 'securityInputNeededText') }
  }
}
