package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserEscapePage extends Page {

  static String bookingId

  static url = '/form/ratings/escapeRating/' + bookingId

  static at = {
    headingText == 'Risk of escape'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    warningTextDiv(required: false) { $('div.govuk-warning-text') }
    info(required: false) { $('div.govuk-inset-text') }
    alertInfo(required: false) { $('.govuk-details__text p') }
    saveButton { $('button.govuk-button') }
    escapeCatBQuestion(required: false) { $('input', name: 'escapeCatB') }
    escapeCatBRadio(required: false) { $('input', name: 'escapeCatB') }
    escapeCatBTextarea(required: false) { $('#escapeCatBText') }
    escapeOtherEvidenceRadio { $('input', name: 'escapeOtherEvidence') }
    escapeOtherEvidenceTextarea { $('#escapeOtherEvidenceText') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }
  }
}
