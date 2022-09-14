package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class NextReviewDateEditingPage extends Page {

  static url = '/form/nextReviewDate/nextReviewDateEditing'

  static at = {
    headingText == 'Check the date they will be reviewed by'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    chosenDate { $('p#chosenDate') }
    changeLink { $('a#changeLink') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('.govuk-error-message') }
  }
}
