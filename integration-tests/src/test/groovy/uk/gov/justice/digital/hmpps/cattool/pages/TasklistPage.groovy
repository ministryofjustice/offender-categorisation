package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class TasklistPage extends Page {

  static String bookingId

  static url = '/tasklist/' + bookingId

  static at = {
    headingText == 'Complete a categorisation'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-grid-column-one-third') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    sentenceTableRow1(required: false) { $('table#sentences tr', 1).find('td') }
    sentenceTableRow2(required: false) { $('table#sentences tr', 2).find('td') }
    logoutLink { $('a', href: '/sign-out') }
    supervisorMessageButton(required: false) { $('#supervisorMessageButton') }
    offendingHistoryLink { $('#offendingHistoryLink') }
    furtherChargesButton { $('#furtherChargesButton') }
    securityButton { $('#securityButton') }
    securityLink { $('#securityLink') }
    securityLinkDisabled { $('#securityLinkDisabled') }
    openConditionsButton(required: false) { $('#openConditionsButton') }
    nextReviewDateButton { $('#nextReviewDateButton') }
    nextReviewDateLink { $('#nextReviewDateLink') }

    continueButton(required: false) { $('#review a') }
    continueButtonDisabled(required: false) { $('button:disabled') }
    checkAndSubmitLink(required: false) { $('a#checkAndSubmitLink') }
    checkAndSubmitLinkDisabled(required: false) { $('#checkAndSubmitLinkDisabled') }
    violenceButton { $('#violenceButton') }
    escapeButton { $('#escapeButton') }
    extremismButton { $('#extremismButton') }
    decisionButton { $('#decisionButton') }
    categorisationHomeLink { $('a', text: 'Categorisation dashboard') }
    summarySection(required: true) { $('#review div') }

    cancelLink { $('a#cancelLink') }
  }
}
