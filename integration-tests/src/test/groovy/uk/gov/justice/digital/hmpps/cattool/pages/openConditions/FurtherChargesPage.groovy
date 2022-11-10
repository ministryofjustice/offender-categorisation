package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class FurtherChargesPage extends Page {

  static url = '/form/openConditions/furtherCharges'

  static at = {
    headingText == 'Further charges'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    furtherChargesYes { $('#furtherCharges') }
    furtherChargesNo { $('#furtherCharges-2') }
    increasedRiskYes(required: false)  { $('#increasedRisk') }
    increasedRiskNo(required: false)  { $('#increasedRisk-2') }
    furtherChargesText(required: false) { $('textarea', name: 'furtherChargesText') }

    submitButton { $('button', type: 'submit') }

    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
