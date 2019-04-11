package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class EarliestReleasePage extends Page {

  static url = '/form/openConditions/earliestReleaseDate'

  static at = {
    headingText == 'Time until earliest release date'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    threeOrMoreYearsYes { $('#threeOrMoreYears-1') }
    threeOrMoreYearsNo { $('#threeOrMoreYears-2') }
    justifyYes(required: false) { $('#justify-1') }
    justifyNo(required: false) { $('#justify-2') }
    justifyText(required: false) { $('textarea', name: 'justifyText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
