package uk.gov.justice.digital.hmpps.cattool.pages

class SupervisorMessagePage extends HeaderPage {

  static url = '/form/supervisor/supervisorMessage'

  static at = {
    headingText == 'Message from supervisor'
  }

  static content = {
    messageValues { $('dd') }

    submitButton { $('button', type: 'submit') }

  }
}
