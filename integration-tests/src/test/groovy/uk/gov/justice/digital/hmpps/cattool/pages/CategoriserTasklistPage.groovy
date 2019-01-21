package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserTasklistPage extends Page {

  static String bookingId

  static url = '/tasklist/' + bookingId

  static at = {
    headingText == 'Categorisation task list'
  }

  static content = {
    headingText { $('h1.govuk-heading-m').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
  }
}
