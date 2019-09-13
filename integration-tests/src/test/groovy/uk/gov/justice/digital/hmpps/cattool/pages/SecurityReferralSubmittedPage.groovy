package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SecurityReferralSubmittedPage extends Page {

  static at = {
    headingText == 'Automatic referral setup successful'
  }

  static content = {
    headingText { $('h1.govuk-panel__title').text() }
  }
}
