package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class ReviewPage extends Page {

  static url = '/form/categoriser/review'

  static at = {
    headingText == 'Check your answers before you continue'
  }

  static content = {
    headingText { $('h1.main-heading').text() }

    form { $('form') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    changeLinks { $('a.govuk-link', text: startsWith('Change')) }
    newCatMessage(required: false) { $('#newCatMessage') }

    offendingHistorySummary { $('.offendingHistorySummary .govuk-summary-list__value') }
    furtherChargesSummary { $('.furtherChargesSummary .govuk-summary-list__value') }
    violenceRatingSummary { $('.violenceRatingSummary .govuk-summary-list__value') }
    escapeRatingSummary { $('.escapeRatingSummary .govuk-summary-list__value') }
    extremismRatingSummary { $('.extremismRatingSummary .govuk-summary-list__value') }
    securityInputSummary { $('.securityInputSummary .govuk-summary-list__value') }

    riskLevel { $('.riskLevelSummary .govuk-summary-list__value') }
    furtherCharges { $('.furtherChargesOpenSummary .govuk-summary-list__value') }
    riskOfHarm { $('.riskOfHarmSummary .govuk-summary-list__value') }
    foreignNational { $('.foreignNationalSummary .govuk-summary-list__value') }
    earliestReleaseDate(required: false) { $('.earliestReleaseDateSummary .govuk-summary-list__value') }
  }
}
