package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SecurityViewPage extends Page {

  static url = '/supervisor/view'

  static at = {
    headingText == 'Security review outcome'
  }

  static content = {
    headingText { $('h1').text() }
    securityInputSummary { $('.securitySummary .govuk-summary-list__value') }
    logoutLink { $('a', href: '/logout')}
  }
}
