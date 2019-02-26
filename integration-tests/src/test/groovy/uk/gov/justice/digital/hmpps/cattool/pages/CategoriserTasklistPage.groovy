package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserTasklistPage extends Page {

  static String bookingId

  static url = '/tasklist/' + bookingId

  static at = {
    headingText == 'Categorisation task list'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    logoutLink { $('a', href: '/logout')}
    startButtons { bodyRows*.$('td', 5)*.find('a') }
    offendingHistoryButton { $('#offendingHistoryButton') }
    securityButton { $('#securityButton') }
    continueButton(required: false) { $('#review a') }
    continueButtonDisabled(required: false) { $('button.govuk-button--disabled') }
    violenceButton { $('#violenceButton') }
    escapeButton { $('#escapeButton') }
    extremismButton { $('#extremismButton') }
    backLink { $('a.govuk-back-link') }
  }
}
