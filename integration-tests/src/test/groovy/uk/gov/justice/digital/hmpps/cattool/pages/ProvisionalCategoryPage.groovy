package uk.gov.justice.digital.hmpps.cattool.pages

class ProvisionalCategoryPage extends HeaderPage {

  static String bookingId

  static url = '/form/categoriser/provisionalCategory'

  static at = {
    headingText == 'Provisional category'
    url + '/' + bookingId == '/' + (browser.getCurrentUrl() - browser.getBaseUrl())
  }

  static content = {
    warning { $('div.govuk-warning-text') }
    form { $('form') }
    appropriateYes(required: false) { $('#categoryAppropriate') }
    appropriateNo(required: false) { $('#categoryAppropriate-2') }
    overriddenCategoryB(required: false) { $('#overriddenCategoryB') }
    overriddenCategoryC(required: false) { $('#overriddenCategoryC') }
    overriddenCategoryD(required: false) { $('#overriddenCategoryD') }
    newCatMessage(required: false) { $('h2.govuk-heading-m') }
    overriddenCategoryText(required: false) { $('#overriddenCategoryText') }
    otherInformationText(required: false) { $('#otherInformationText') }
    indeterminateWarning(required: false) { $('#indeterminateWarning') }
    submitButton { $('button', type: 'submit') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('.govuk-error-message') }
  }
}
