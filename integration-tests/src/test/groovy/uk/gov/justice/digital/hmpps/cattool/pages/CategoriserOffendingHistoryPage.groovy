package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserOffendingHistoryPage extends Page {

  static String bookingId

  static url = '/form/ratings/offendingHistory/' + bookingId

  static at = {
    headingText == 'Offending history'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    catAWarning(required: false) { $('div.govuk-warning-text') }
    saveButton { $('button.govuk-button') }
  }
}
