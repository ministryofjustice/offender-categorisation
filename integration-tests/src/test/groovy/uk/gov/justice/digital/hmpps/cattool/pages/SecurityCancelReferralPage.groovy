package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SecurityCancelReferralPage extends Page {

  static at = {
    headingText == 'Confirm cancellation'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    radio { $('input', name: 'confirm') }
    submitButton { $('button.govuk-button') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
