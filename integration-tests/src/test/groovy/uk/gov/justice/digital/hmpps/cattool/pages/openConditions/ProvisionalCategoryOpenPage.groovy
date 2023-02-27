package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class ProvisionalCategoryOpenPage extends HeaderPage {

  static String bookingId

  static url = '/form/openConditions/provisionalCategory'

  static at = {
    headingText == 'Provisional category'
    url + '/' + bookingId == '/' + (browser.getCurrentUrl() - browser.getBaseUrl())
  }

  static content = {
    warning { $('div.govuk-warning-text') }
    form { $('form') }
    appropriateYes(required: false) { $('#openConditionsCategoryAppropriate') }
    appropriateNo(required: false) { $('#openConditionsCategoryAppropriate-2') }
    newCatMessage(required: false) { $('h2.govuk-heading-m') }
    overriddenCategoryText(required: false) { $('#overriddenCategoryText') }
    otherInformationText(required: false) { $('#otherInformationText') }
    indeterminateWarning(required: false) { $('#indeterminateWarning') }
    submitButton { $('button', type: 'submit') }

    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('.govuk-error-message') }
  }
}
