package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class DecisionPage extends HeaderPage {

  static url = '/form/recat/decision'

  static at = {
    headingText == 'Category decision'
  }

  static content = {
    form { $('form') }
    behaviour { $('#behaviour') }
    categoryBOption { $('#catBOption') }
    categoryJOption(required: false) { $('#catJOption') }
    categoryIOption(required: false) { $('#catIOption') }
    categoryDOption(required: false) { $('#catDOption') }
    categoryROption(required: false) { $('#closedOption') }
    categoryCOption { $('#catCOption') }
    hints { $('.govuk-radios__hint') }
    indeterminateWarning(required: false) { $('#indeterminateWarning') }

    submitButton { $('button', type: 'submit') }

    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
