package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserSecurityInputPage extends Page {

  static String bookingId

  static url = '/form/ratings/securityInput/' + bookingId

  static at = {
    headingText == 'Security input'
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
