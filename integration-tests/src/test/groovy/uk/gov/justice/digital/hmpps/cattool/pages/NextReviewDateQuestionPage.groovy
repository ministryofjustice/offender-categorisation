package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class NextReviewDateQuestionPage extends Page {

  static url = '/form/nextReviewDate/nextReviewDateQuestion'

  static at = {
    headingText == 'When should they next be reviewed by?'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }
    sixMonthsOption { $('#nextDateChoice') }
    twelveMonthsOption { $('#nextDateChoice-2') }
    specificOption { $('#nextDateChoice-3') }

    submitButton { $('button', type: 'submit') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
