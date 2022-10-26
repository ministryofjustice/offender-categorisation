package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class PreviousSentencesPage extends Page  {
  static url = '/form/openConditions/previousSentences'

  static at = {
    headingText == 'Previous sentences'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    releasedLastFiveYearsYes { $('#releasedLastFiveYears') }
    releasedLastFiveYearsNo { $('#releasedLastFiveYears-2') }
    sevenOrMoreYearsYes(required: false)  { $('#sevenOrMoreYears') }
    sevenOrMoreYearsNo(required: false)  { $('#sevenOrMoreYears-2') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
