package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserSubmittedPage extends Page {

  static url = '/tasklist/categoriserSubmitted'

  static at = {
    headingText == 'Submitted for approval'
  }

  static content = {
    headingText { $('h1.govuk-panel__title').text() }
    finishButton{ $('#main-content > a') }
  }
}
