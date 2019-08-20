package uk.gov.justice.digital.hmpps.cattool.pages

class SecurityReviewPage extends HeaderPage {

  static String bookingId

  static url = '/form/security/review/' + bookingId

  static at = {
    headingText == 'Security Review'
  }

  static content = {
    backLink { $('a.govuk-back-link') }
    categoriserText { $('p.forms-comments-text')}
    saveButton { $('button.govuk-button') }
    securityText{ $('textarea', name: 'securityReview') }
  }
}
