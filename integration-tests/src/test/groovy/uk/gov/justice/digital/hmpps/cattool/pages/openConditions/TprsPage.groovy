package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class TprsPage extends Page {

  static url = '/form/openConditions/tprs'

  static at = {
    headingText == 'Is this prisoner eligible for the Temporary Presumptive Recategorisation Scheme (TPRS)?'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    tprsSelectedYes { $('#tprsSelected') }
    tprsSelectedNo { $('#tprsSelected-2') }

    submitButton { $('button', type: 'submit') }

    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
