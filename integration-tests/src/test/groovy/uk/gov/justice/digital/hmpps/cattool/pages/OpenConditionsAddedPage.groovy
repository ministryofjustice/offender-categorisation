package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class OpenConditionsAddedPage extends Page {

  static url = '/openConditionsAdded'

  static at = {
    headingText == 'Open Conditions Assessment added to your task list'
  }

  static content = {
    headingText { $('h1').text() }
    button { $('a.govuk-button') }
  }
}
