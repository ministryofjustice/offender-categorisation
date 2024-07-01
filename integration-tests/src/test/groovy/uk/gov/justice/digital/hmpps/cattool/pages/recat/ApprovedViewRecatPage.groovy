package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.ApprovedViewPage

class ApprovedViewRecatPage extends ApprovedViewPage {

  static at = {
    headingText == 'Categorisation review outcome'
  }

  static content = {
    prisonerBackgroundSummary { $('.prisonerBackgroundSummary .govuk-summary-list__value') }
  }
}
