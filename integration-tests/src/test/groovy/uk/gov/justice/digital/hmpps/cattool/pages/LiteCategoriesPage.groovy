package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class LiteCategoriesPage extends Page {

  static url = '/'

  static at = {
    headingText == 'Other category assessment'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form(required: false) { $('form') }
    saveButton(required: false) { $('button.govuk-button') }
    warning(required: false) { $('div.govuk-warning-text') }
    errorSummaries {$('ul.govuk-error-summary__list li')}
    errors {$('span.govuk-error-message')}
  }
}
