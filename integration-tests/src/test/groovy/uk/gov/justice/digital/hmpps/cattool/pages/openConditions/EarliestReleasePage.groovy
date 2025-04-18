package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class EarliestReleasePage extends Page {

  static url = '/form/openConditions/earliestReleaseDate'

  static at = {
    headingText == 'Earliest release date'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    fiveOrMoreYearsYes { $('#fiveOrMoreYears') }
    fiveOrMoreYearsNo { $('#fiveOrMoreYears-2') }
    justifyYes(required: false) { $('#justify') }
    justifyNo(required: false) { $('#justify-2') }
    justifyText(required: false) { $('textarea', name: 'justifyText') }

    submitButton { $('button', type: 'submit') }

    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
