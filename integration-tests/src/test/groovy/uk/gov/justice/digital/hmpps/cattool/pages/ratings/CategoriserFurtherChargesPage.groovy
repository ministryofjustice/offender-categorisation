package uk.gov.justice.digital.hmpps.cattool.pages.ratings

import geb.Page

class CategoriserFurtherChargesPage extends Page {

  static String bookingId

  static url = '/form/ratings/furtherCharges/' + bookingId

  static at = {
    headingText == 'Further charges'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    form { $('form') }
    saveButton { $('button.govuk-button') }
    furtherChargesYes { $('#furtherCharges-1') }
    furtherChargesNo { $('#furtherCharges-2') }
    furtherChargesCatBYes { $('#furtherChargesCatB-1') }
    furtherChargesCatBNo { $('#furtherChargesCatB-2') }
    furtherChargesText { $('#furtherChargesText') }
    history { $('div.forms-comments-text li') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }
  }
}
