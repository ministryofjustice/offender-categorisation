package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class ErrorPage extends Page {

  static url = '/form/categoriser/review'

  static at = {

  }

  static content = {
    errorSummaryTitle { $('#error-summary-title') }
    errorText { $( 'a.govuk-back-link') }
  }
}
