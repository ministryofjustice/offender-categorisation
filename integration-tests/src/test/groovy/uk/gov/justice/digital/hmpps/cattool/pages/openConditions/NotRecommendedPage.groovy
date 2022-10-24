package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class NotRecommendedPage extends Page {

  static url = '/form/openConditions/notRecommended'

  static at = {
    headingText == 'Open conditions not recommended'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    stillReferYes { $('#stillRefer') }
    stillReferNo { $('#stillRefer-2') }

    reasons { $('#notRecommendedList').find('li') }
    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
