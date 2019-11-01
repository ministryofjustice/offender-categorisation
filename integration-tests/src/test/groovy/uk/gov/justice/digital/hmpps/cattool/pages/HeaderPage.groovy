package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

abstract class HeaderPage extends Page {

  static content = {
    backLink { $('a.govuk-back-link') }

    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }
  }
}
