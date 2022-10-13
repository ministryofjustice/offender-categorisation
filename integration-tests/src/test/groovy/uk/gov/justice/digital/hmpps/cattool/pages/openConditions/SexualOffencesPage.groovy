package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class SexualOffencesPage extends Page  {
  static url = '/form/openConditions/sexualOffences'

  static at = {
    headingText == 'Sexual offence'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    haveTheyBeenEverConvictedYes { $('#haveTheyBeenEverConvicted') }
    haveTheyBeenEverConvictedNo { $('#haveTheyBeenEverConvicted-2') }
    canTheRiskBeManagedYes(required: false) { $('#canTheRiskBeManaged') }
    canTheRiskBeManagedNo(required: false) { $('#canTheRiskBeManaged-2') }
    howTheRiskCanBeManaged(required: false) { $('#howTheRiskCanBeManaged') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
