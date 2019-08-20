package uk.gov.justice.digital.hmpps.cattool.pages

class SupervisorMessagePage extends HeaderPage {

  static url = '/form/supervisor/supervisorMessage'

  static at = {
    headingText == 'Message from supervisor'
  }

  static content = {
    messageText { $('#messageText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
  }
}
