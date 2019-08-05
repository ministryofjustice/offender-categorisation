package uk.gov.justice.digital.hmpps.cattool.pages.openConditions

import geb.Page

class ProvisionalCategoryOpenPage extends Page {

  static String bookingId

  static url = '/form/openConditions/provisionalCategory'

  static at = {
    headingText == 'Provisional category'
    url + '/' + bookingId == '/' + (browser.getCurrentUrl() - browser.getBaseUrl())
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }

    warning { $('div.govuk-warning-text') }
    form { $('form') }
    appropriateYes(required: false) { $('#openConditionsCategoryAppropriate') }
    appropriateNo(required: false) { $('#openConditionsCategoryAppropriate-2') }
    newCatMessage(required: false) { $('h2.govuk-heading-m') }
    overriddenCategoryText(required: false) { $('#overriddenCategoryText') }
    otherInformationText(required: false) { $('#otherInformationText') }
    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }
  }
}
