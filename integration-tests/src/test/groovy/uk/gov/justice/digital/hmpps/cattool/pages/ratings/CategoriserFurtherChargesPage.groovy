package uk.gov.justice.digital.hmpps.cattool.pages.ratings

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class CategoriserFurtherChargesPage extends HeaderPage {

  static String bookingId

  static url = '/form/ratings/furtherCharges/' + bookingId

  static at = {
    headingText == 'Further charges'
  }

  static content = {
    form { $('form') }
    saveButton { $('button.govuk-button') }
    furtherChargesYes { $('#furtherCharges') }
    furtherChargesNo { $('#furtherCharges-2') }
    furtherChargesCatBYes { $('#furtherChargesCatB') }
    furtherChargesCatBNo { $('#furtherChargesCatB-2') }
    furtherChargesText { $('#furtherChargesText') }
    history { $('div.forms-comments-text li') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span#furtherCharges-error.govuk-error-message') }
  }
}
