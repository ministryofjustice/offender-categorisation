package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserSecurityInputPage extends Page {

  static String bookingId

  static url = '/form/ratings/securityInput/' + bookingId

  static at = {
    headingText == 'Security input'
  }

  static content = {
    headingText { $('h1.govuk-heading-m').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
  }
}
