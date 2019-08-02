package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorConfirmBackPage extends Page {

  static url = '/form/supervisor/confirmBack'

  static at = {
    headingText == 'Confirm Status Change'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }

    form {$('form')}

    answerYes { $('#confirmation-1') }
    answerNo { $('#confirmation-2') }
    messageText {$('#messageText')}

    submitButton { $('button', type:'submit') }
    backLink { $( 'a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
