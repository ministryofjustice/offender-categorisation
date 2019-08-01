package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorMessagePage extends Page {

  static url = '/form/supervisor/supervisorMessage'

  static at = {
    headingText == 'Message from supervisor'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }

    messageText { $('#messageText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
  }
}
