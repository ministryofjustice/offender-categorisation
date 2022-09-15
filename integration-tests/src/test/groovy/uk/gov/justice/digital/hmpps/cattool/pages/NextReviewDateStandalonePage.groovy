package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class NextReviewDateStandalonePage extends Page {

  static url = '/form/nextReviewDate/nextReviewDateStandalone'

  static at = {
    headingText == 'Change the review date'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }
    existingDate { $('#existingDate') }
    reviewDate { $('#reviewDate') }
    reason { $('#reason') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
