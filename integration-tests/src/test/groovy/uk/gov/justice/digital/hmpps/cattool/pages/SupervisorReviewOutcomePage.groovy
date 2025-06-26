package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorReviewOutcomePage extends Page {

  static url = '/form/supervisor/review'

  static at = {
    headingText == 'Review outcome saved'
  }

  static content = {
    headingText { $('h1.govuk-panel__title').text() }
    finishButton { $('a.govuk-button') }
    userHeader { $('div.user-block') }
  }
}
