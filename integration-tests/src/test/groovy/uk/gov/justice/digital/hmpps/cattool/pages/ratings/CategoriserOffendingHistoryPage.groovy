package uk.gov.justice.digital.hmpps.cattool.pages.ratings

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
    catAInfo(required: false) { $('div.govuk-inset-text') }
    form { $('form') }
    previousConvictionsText { $('#previousConvictionsText') }
    saveButton { $('button.govuk-button') }
    previousConvictionsYes { $('#previousConvictions') }
    previousConvictionsNo { $('#previousConvictions-2') }
    history { $('div.forms-comments-text li') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }
  }
}
