package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class FasttrackProgressPage extends HeaderPage {

  static url = '/form/recat/fasttrackProgress'

  static at = {
    headingText == 'Please detail any progress made by the prisoner since the last review'
  }

  static content = {
    form { $('form') }
    progressText { $('#progressText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
