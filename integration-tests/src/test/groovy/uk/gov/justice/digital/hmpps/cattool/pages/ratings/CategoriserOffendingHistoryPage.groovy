package uk.gov.justice.digital.hmpps.cattool.pages.ratings

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class CategoriserOffendingHistoryPage extends HeaderPage {

  static String bookingId

  static url = '/form/ratings/offendingHistory/' + bookingId

  static at = {
    headingText == 'Offending history'
  }

  static content = {
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
