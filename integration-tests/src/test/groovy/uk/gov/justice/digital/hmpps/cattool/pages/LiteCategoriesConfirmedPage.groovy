package uk.gov.justice.digital.hmpps.cattool.pages

class LiteCategoriesConfirmedPage extends HeaderPage {

  static at = {
    panelText.text() == 'Categorisation has been saved'
  }

  static content = {
    panelText { $('h1.govuk-panel__title') }
    finishButton { $('a.govuk-button') }
    manageLink { $('a#manageLink') }
  }
}
