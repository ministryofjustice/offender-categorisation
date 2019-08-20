package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class ReviewRecatPage extends Page {

  static url = '/form/recat/review'

  static at = {
    headingText == 'Check your answers before submitting'
  }

  static content = {
    headingText { $('h1.main-heading').text() }
    headerBlock { $('div.govuk-grid-column-one-third') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    changeLinks { $('a.govuk-link', text: startsWith('Change')) }

    prisonerBackgroundSummary { $('.prisonerBackgroundSummary .govuk-summary-list__value') }
    securityInputSummary { $('.securityInputSummary .govuk-summary-list__value') }
    riskAssessmentSummary { $('.riskAssessmentSummary .govuk-summary-list__value') }
    assessmentSummary { $('.assessmentSummary .govuk-summary-list__value') }
    nextReviewDateSummary { $('.nextReviewDateSummary .govuk-summary-list__value') }
    higherSecurityReviewSummary { $('.higherSecurityReview .govuk-summary-list__value') }

    riskLevel { $('.riskLevelSummary .govuk-summary-list__value') }
    furtherCharges { $('.furtherChargesOpenSummary .govuk-summary-list__value') }
    riskOfHarm { $('.riskOfHarmSummary .govuk-summary-list__value') }
    foreignNational { $('.foreignNationalSummary .govuk-summary-list__value') }
    earliestReleaseDate(required: false) { $('.earliestReleaseDateSummary .govuk-summary-list__value') }
  }
}
