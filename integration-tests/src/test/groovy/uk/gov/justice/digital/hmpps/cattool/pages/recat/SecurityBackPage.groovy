package uk.gov.justice.digital.hmpps.cattool.pages.recat

class SecurityBackPage extends SecurityInputPage {

  static url = '/form/recat/securityBack/' + SecurityInputPage.bookingId

  static content = {
    noteFromSecurity { $('div.govuk-inset-text') }
  }
}
