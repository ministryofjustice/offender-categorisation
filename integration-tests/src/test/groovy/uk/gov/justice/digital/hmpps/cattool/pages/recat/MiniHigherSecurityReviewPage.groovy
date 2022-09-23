package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class MiniHigherSecurityReviewPage extends Page {

  static url = '/form/recat/miniHigherSecurityReview'

  static at = {
    headingText == 'Higher Security Review'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }
    conditions { $('#conditions') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
