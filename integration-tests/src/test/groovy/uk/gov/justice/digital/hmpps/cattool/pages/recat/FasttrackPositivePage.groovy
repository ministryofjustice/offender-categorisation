package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class FasttrackPositivePage extends HeaderPage {

  static url = '/form/recat/fasttrackPositiveProgress'

  static at = {
    headingText == 'Are they making any positive progress?'
  }

  static content = {
    form { $('form') }
    positiveYes { $('#positiveProgress') }
    positiveNo { $('#positiveProgress-2') }
    positiveText { $('#positiveProgressText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
