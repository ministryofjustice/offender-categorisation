package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class TasklistPage extends Page {

  static String bookingId

  static url = '/tasklist/' + bookingId

  static at = {
    headingText == 'Categorisation task list'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-grid-column-one-third') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }
    sentenceTableRow1(required: false) { $('table#sentences tr', 1).find('td') }
    sentenceTableRow2(required: false) { $('table#sentences tr', 2).find('td') }
    logoutLink { $('a', href: '/logout') }
    supervisorMessageButton { $('#supervisorMessageButton') }
    offendingHistoryButton { $('#offendingHistoryButton') }
    furtherChargesButton { $('#furtherChargesButton') }
    securityButton { $('#securityButton') }
    openConditionsButton(required: false) { $('#openConditionsButton') }
    nextReviewDateButton { $('#nextReviewDateButton') }

    continueButton(required: false) { $('#review a') }
    continueButtonDisabled(required: false) { $('button.govuk-button--disabled') }
    violenceButton { $('#violenceButton') }
    escapeButton { $('#escapeButton') }
    extremismButton { $('#extremismButton') }
    categorisationHomeLink { $('a', text: 'Categorisation home') }
    summarySection(required: true) { $('#review div') }
  }
}
