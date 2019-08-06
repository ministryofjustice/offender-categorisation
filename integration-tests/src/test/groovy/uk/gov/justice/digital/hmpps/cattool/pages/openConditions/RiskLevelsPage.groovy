package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class RiskLevelsPage extends Page {

  static url = '/form/openConditions/riskLevels'

  static at = {
    headingText == 'Risk levels'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    likelyToAbscondYes { $('#likelyToAbscond') }
    likelyToAbscondNo { $('#likelyToAbscond-2') }
    likelyToAbscondText(required: false) { $('textarea', name: 'likelyToAbscondText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
