package uk.gov.justice.digital.hmpps.cattool.pages.ratings

class CategoriserSecurityBackPage extends CategoriserSecurityInputPage {

  static url = '/form/ratings/securityBack/' + CategoriserSecurityInputPage.bookingId

  static content = {
    catBRadio { $('input', name: 'catB') }
    noteFromSecurity { $('div.govuk-inset-text') }
    warning(required: false) { $('div.govuk-warning-text') }
  }
}
