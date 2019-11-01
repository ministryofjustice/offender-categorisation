package uk.gov.justice.digital.hmpps.cattool.pages

class CancelConfirmedPage extends HeaderPage {

  static url = '/form/cancelConfirmed'

  static at = {
    panelText.text() == 'Categorisation has been removed'
  }

  static content = {
    panelText { $('h1.govuk-panel__title') }
    finishButton { $('a.govuk-button') }
    manageLink { $('a#manageLink') }
  }
}
