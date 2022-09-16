package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class PrisonerBackgroundPage extends Page {

  static url = '/form/recat/prisonerBackground'

  static at = {
    headingText == 'Prisoner background'
  }

  static content = {
    headingText { $('#mainHeader').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    escapeWarning(required: false) { $('#escapeWarning') }
    alertInfo(required: false) { $('#alertDetails p') }
    escapeInfo(required: false) { $('#escapeInfo') }

    extremismWarning(required: false) { $('#extremismWarning') }
    extremismInfo(required: false) { $('#extremismInfo') }

    violenceWarning(required: false) { $('#violenceWarning') }
    violenceNotifyWarning(required: false) { $('#violenceNotifyWarning') }
    violenceInfo(required: false) { $('#violenceInfo') }

    offenceDetails{ $('#offenceDetails') }

    form { $('form') }

    historyLink { $('#historyLink') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
