package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class TasklistRecatPage extends Page {

  static url = '/tasklistRecat'

  static at = {
    headingText == 'Re-categorisation task list'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-grid-column-one-third') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    logoutLink { $('a', href: '/logout')}
    startButtons { bodyRows*.$('td', 5)*.find('a') }
    mainFlowButton { $('#mainFlowButton') }
    securityButton { $('#securityButton') }
    continueButton(required: false) { $('#review a') }
    continueButtonDisabled(required: false) { $('button.govuk-button--disabled') }
    backLink { $('a.govuk-back-link') }
    summarySection (required: true) { $('#review div') }
    openConditionsButton (required: false){ $('#openConditionsButton') }
  }
}
