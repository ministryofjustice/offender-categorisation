package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class SuitabilityPage extends Page {

  static url = '/form/openConditions/suitability'

  static at = {
    headingText == 'Suitability for open conditions'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    isOtherInformationYes { $('#isOtherInformation-1') }
    isOtherInformationNo { $('#isOtherInformation-2') }
    otherInformationText(required: false) { $('textarea', name: 'otherInformationText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
