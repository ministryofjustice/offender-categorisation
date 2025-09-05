package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class TasklistRecatPage extends Page {

  static url = '/tasklistRecat'

  static at = {
    headingText == 'Complete a categorisation review'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-grid-column-one-third') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }
    headerLink { headerBlock.$('a') }
    logoutLink { $('a', href: '/sign-out') }

    supervisorMessageButton(required: false) { $('#supervisorMessageButton') }
    fastrackEligibilityButton(required: false) { $('#fastrackEligibilityButton') }
    prisonerBackgroundButton { $('#prisonerBackgroundButton') }
    securityButton { $('#securityButton') }
    riskAssessmentButton { $('#riskAssessmentButton') }
    decisionButton { $('#decisionButton') }
    openConditionsButton(required: false) { $('#openConditionsButton') }
    nextReviewDateButton { $('#nextReviewDateButton') }

    continueButton(required: false) { $('#review a') }
    continueButtonDisabled(required: false) { $('button:disabled') }
    categorisationHomeLink { $('a', text: 'Categorisation dashboard') }
    summarySection(required: true) { $('#review div') }
    oasysInputButton(required: true) { $('#oasysInputButton') }
    cancelLink { $('a#cancelLink') }
  }
}
