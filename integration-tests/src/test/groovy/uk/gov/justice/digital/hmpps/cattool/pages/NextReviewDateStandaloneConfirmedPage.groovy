package uk.gov.justice.digital.hmpps.cattool.pages

class NextReviewDateStandaloneConfirmedPage extends HeaderPage {

  static url = '/form/nextReviewDate/nextReviewDateStandaloneConfirmed'

  static at = {
    panelText.text() == 'Next review date has been changed'
  }

  static content = {
    backLink { $('a.govuk-back-link') }
    panelText { $('h1.govuk-panel__title') }
    finishButton { $('a.govuk-button') }
  }
}
