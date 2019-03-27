package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class ExtremismPage extends Page {

  static url = '/form/ratings/extremismRating'

  static at = {
    headingText == 'Extremism'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    warningMessage(required: false) { $('div.govuk-warning-text') }
    info(required: false) { $('div.govuk-inset-text') }

    form { $('form') }
    previousTerrorismOffencesYes { $('#previousTerrorismOffences-1') }
    previousTerrorismOffencesNo { $('#previousTerrorismOffences-2') }
    previousTerrorismOffencesText { $('#previousTerrorismOffencesText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
