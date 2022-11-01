package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

abstract class HeaderPage extends Page {

  static content = {

    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }
  }
}
