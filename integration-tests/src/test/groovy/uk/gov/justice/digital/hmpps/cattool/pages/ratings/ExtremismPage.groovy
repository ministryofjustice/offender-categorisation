package uk.gov.justice.digital.hmpps.cattool.pages.ratings

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class ExtremismPage extends HeaderPage {

  static url = '/form/ratings/extremismRating'

  static at = {
    headingText == 'Extremism'
  }

  static content = {
    warningMessage(required: false) { $('div.govuk-warning-text') }
    info(required: false) { $('div.govuk-inset-text') }

    form { $('form') }
    previousTerrorismOffencesYes { $('#previousTerrorismOffences') }
    previousTerrorismOffencesNo { $('#previousTerrorismOffences-2') }
    previousTerrorismOffencesText { $('#previousTerrorismOffencesText') }

    submitButton { $('button', type: 'submit') }

    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
