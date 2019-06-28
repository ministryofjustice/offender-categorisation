package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class DecisionPage extends Page {

  static url = '/form/recat/decision'

  static at = {
    headingText == 'Category decision'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }
    behaviour { $('#behaviour') }
    categoryBOption { $('#catBOption') }
    categoryJOption (required: false){ $('#catJOption') }
    categoryIOption (required: false){ $('#catIOption') }
    categoryDOption (required: false){ $('#catDOption') }
    categoryCOption { $('#catCOption') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
