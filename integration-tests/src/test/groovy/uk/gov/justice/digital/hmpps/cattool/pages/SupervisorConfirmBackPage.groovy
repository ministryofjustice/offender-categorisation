package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorConfirmBackPage extends Page {

  static url = '/form/supervisor/confirmBack'

  static at = {
    headingText == 'Confirm status change'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }

    form {$('form')}

    answerYes { $('#confirmation') }
    answerNo { $('#confirmation-2') }
    messageText {$('#messageText')}

    submitButton { $('button', type:'submit') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
