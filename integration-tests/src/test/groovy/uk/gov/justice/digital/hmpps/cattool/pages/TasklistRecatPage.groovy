package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class TasklistRecatPage extends Page {

  static url = '/tasklistRecat'

  static at = {
    headingText == 'Category review task list'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-grid-column-one-third') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }
    headerLink { headerBlock.$('a') }
    logoutLink { $('a', href: '/logout') }

    supervisorMessageButton { $('#supervisorMessageButton') }
    prisonerBackgroundButton { $('#prisonerBackgroundButton') }
    securityButton { $('#securityButton') }
    riskAssessmentButton { $('#riskAssessmentButton') }
    decisionButton { $('#decisionButton') }
    openConditionsButton(required: false) { $('#openConditionsButton') }
    nextReviewDateButton { $('#nextReviewDateButton') }

    continueButton(required: false) { $('#review a') }
    continueButtonDisabled(required: false) { $('button.govuk-button--disabled') }
    backLink { $('a.govuk-back-link') }
    summarySection(required: true) { $('#review div') }
  }
}
