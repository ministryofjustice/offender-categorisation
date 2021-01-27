package uk.gov.justice.digital.hmpps.cattool.pages

class LiteCategoriesAlreadyApprovedPage extends HeaderPage {

  static at = {
    panelText.text() == 'Categorisation has already been approved'
  }

  static content = {
    panelText { $('h1.govuk-panel__title') }
    finishButton { $('a.govuk-button') }
  }
}
