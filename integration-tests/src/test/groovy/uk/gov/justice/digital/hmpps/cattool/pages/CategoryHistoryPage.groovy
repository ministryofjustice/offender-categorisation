package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoryHistoryPage extends Page {

  static url = '/'

  static at = {
    headingText == 'Check previous category reviews'
  }

  static content = {
    headingText { $('h1').text() }
    rows { $('table > tbody > tr') }
  }
}
