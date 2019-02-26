package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SecurityReviewPage extends Page {

  static String bookingId

  static url = '/form/security/review/' + bookingId

  static at = {
    headingText == 'Security Review'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    backLink { $('a.govuk-back-link') }
    categoriserText { $('p.govuk-body-s')}
    saveButton { $('button.govuk-button') }
    securityText{ $('textarea', name: 'securityReview') }
  }
}
