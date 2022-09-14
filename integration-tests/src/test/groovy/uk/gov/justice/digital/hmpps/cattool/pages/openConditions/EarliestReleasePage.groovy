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
    threeOrMoreYearsYes { $('#threeOrMoreYears') }
    threeOrMoreYearsNo { $('#threeOrMoreYears-2') }
    justifyYes(required: false) { $('#justify') }
    justifyNo(required: false) { $('#justify-2') }
    justifyText(required: false) { $('textarea', name: 'justifyText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('#threeOrMoreYears-error.govuk-error-message') }
  }
}
