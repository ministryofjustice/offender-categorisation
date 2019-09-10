package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class ErrorPage extends Page {

  static at = {
    errorSummaryTitle.displayed
  }

  static content = {
    errorSummaryTitle { $('#error-summary-title') }
    errorText(required: false) { $( 'div.govuk-error-summary__body p') }
  }
}
