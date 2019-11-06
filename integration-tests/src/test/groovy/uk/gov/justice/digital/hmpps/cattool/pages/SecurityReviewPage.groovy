package uk.gov.justice.digital.hmpps.cattool.pages

class SecurityReviewPage extends HeaderPage {

  static String bookingId

  static url = '/form/security/review/' + bookingId

  static at = {
    headingText == 'Security Review'
  }

  static content = {
    backLink { $('a.govuk-back-link') }
    categoriserText { $('p.forms-comments-text') }
    submitButton { $('button.govuk-button', value: 'submit') }
    saveOnlyButton { $('button.govuk-button', value: 'return') }
    securityText { $('textarea', name: 'securityReview') }
  }
}
