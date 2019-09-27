package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class FasttrackEligibilityPage extends HeaderPage {

  static url = '/form/recat/fasttrackEligibility'

  static at = {
    headingText == 'Category C fast track questions'
  }

  static content = {
    form { $('form') }
    earlyCatDYes { $('#earlyCatD') }
    earlyCatDNo { $('#earlyCatD-2') }
    increaseCategoryYes { $('#increaseCategory') }
    increaseCategoryNo { $('#increaseCategory-2') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
