package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class VictimContactSchemePage extends Page {

  static url = '/form/openConditions/victimContactScheme'

  static at = {
    headingText == 'Victim Contact Scheme (VCS)'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    vcsOptedForYes { $('#vcsOptedFor') }
    vcsOptedForNo { $('#vcsOptedFor-2') }
    vloResponseText(required: false) { $('textarea', name: 'vloResponseText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
