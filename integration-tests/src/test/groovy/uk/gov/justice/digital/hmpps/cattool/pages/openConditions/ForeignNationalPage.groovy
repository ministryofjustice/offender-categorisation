package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class ForeignNationalPage extends Page {

  static url = '/form/openConditions/foreignNational'

  static at = {
    headingText == 'Foreign national'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    isForeignNationalYes { $('#isForeignNational') }
    isForeignNationalNo { $('#isForeignNational-2') }
    formCompletedYes(required: false) { $('#formCompleted') }
    formCompletedNo(required: false) { $('#formCompleted-2') }
    dueDeportedYes(required: false) { $('#dueDeported') }
    dueDeportedNo(required: false) { $('#dueDeported-2') }
    exhaustedAppealYes(required: false) { $('#exhaustedAppeal') }
    exhaustedAppealNo(required: false) { $('#exhaustedAppeal-2') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
