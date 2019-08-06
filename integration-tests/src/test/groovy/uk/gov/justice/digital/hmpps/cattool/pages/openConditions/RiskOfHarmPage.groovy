package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class RiskOfHarmPage extends Page {

  static url = '/form/openConditions/riskOfHarm'

  static at = {
    headingText == 'Risk of Serious Harm'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    seriousHarmYes { $('#seriousHarm') }
    seriousHarmNo { $('#seriousHarm-2') }
    harmManagedYes(required: false) { $('#harmManaged') }
    harmManagedNo(required: false) { $('#harmManaged-2') }
    harmManagedText(required: false) { $('textarea', name: 'harmManagedText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
