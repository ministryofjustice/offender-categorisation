package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class LandingPage extends Page {

  static url = '/'

  static at = {
    headingText == 'Start a category review early'
  }

  static content = {
    headingText { $('h1').text() }
    startButton(required: false) { $('a.govuk-button') }
    warning(required: false) { $('div.govuk-warning-text') }
  }
}
