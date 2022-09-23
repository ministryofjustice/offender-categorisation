package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class NextReviewDatePage extends Page {

  static url = '/form/nextReviewDate/nextReviewDate'

  static at = {
    headingText == 'Confirm the date they should be reviewed by'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }
    reviewDate { $('#reviewDate') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
