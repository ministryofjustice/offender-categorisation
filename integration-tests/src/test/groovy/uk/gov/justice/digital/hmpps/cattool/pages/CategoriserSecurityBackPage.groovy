package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserSecurityBackPage extends CategoriserSecurityInputPage {

  static url = '/form/ratings/securityBack/' + bookingId

  static content = {
    catBRadio { $('input', name: 'catB') }
    noteFromSecurity { $('div.govuk-inset-text') }
  }
}
