package uk.gov.justice.digital.hmpps.cattool.pages

class LiteCategoriesAlreadyApprovedPage extends HeaderPage {

  static at = {
    warningText.text().contains('Categorisation has already been approved')
  }

  static content = {
    warningText { $('.govuk-warning-text') }
    finishButton { $('a.govuk-button') }
  }
}
