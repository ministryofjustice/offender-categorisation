package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class LiteApprovalPage extends Page {

  static url = '/'

  static at = {
    headingText == 'Other category approval'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form(required: false) { $('form') }
    saveButton(required: false) { $('button.govuk-button') }
    warning(required: false) { $('div.govuk-warning-text') }
    errorSummaries {$('ul.govuk-error-summary__list li')}
    errors {$('.govuk-error-message')}
  }
}
