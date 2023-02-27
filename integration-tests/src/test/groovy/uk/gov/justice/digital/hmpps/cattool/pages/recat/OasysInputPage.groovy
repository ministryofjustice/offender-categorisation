package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class OasysInputPage extends Page {

  static url = '/form/recat/oasysInput'

  static at = {
    headingText == 'Offender Assessment System (OASys)'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }
    reviewDate { $('#reviewDate') }
    oasysRelevantInfoYes{ $('#oasysRelevantInfo') }
    oasysRelevantInfoNo{ $('#oasysRelevantInfo-2') }
    oasysInputText{ $('#oasysInputText') }
    submitButton { $('button', type: 'submit') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
