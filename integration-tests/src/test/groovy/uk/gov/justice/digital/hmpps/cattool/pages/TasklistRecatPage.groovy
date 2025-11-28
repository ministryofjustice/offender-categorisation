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
    prisonerBackgroundLink { $('#prisonerBackgroundLink') }
    securityButton { $('#securityButton') }
    riskAssessmentButton { $('#riskAssessmentButton') }
    riskAssessmentLink { $('#riskAssessmentLink') }
    decisionButton { $('#decisionButton') }
    openConditionsButton(required: false) { $('#openConditionsButton') }
    nextReviewDateButton { $('#nextReviewDateButton') }
    nextReviewDateLink { $('#nextReviewDateLink') }
    checkAndSubmitLink { $('#checkAndSubmitLink') }
    checkAndSubmitLinkDisabled { $('#checkAndSubmitLinkDisabled') }

    continueButton(required: false) { $('#review a') }
    continueButtonDisabled(required: false) { $('button:disabled') }
    securityLink { $('#securityLink') }
    securityLinkDisabled { $('#securityLinkDisabled') }
    categorisationHomeLink { $('a', text: 'Categorisation dashboard') }
    summarySection(required: true) { $('#review div') }
    oasysInputButton(required: true) { $('#oasysInputButton') }
    cancelLink { $('a#cancelLink') }
  }
}
