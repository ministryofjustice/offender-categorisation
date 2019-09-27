package uk.gov.justice.digital.hmpps.cattool.pages.recat

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class FasttrackRemainPage extends HeaderPage {

  static url = '/form/recat/fasttrackRemain'

  static at = {
    headingText == 'Should they remain in Category C conditions?'
  }

  static content = {
    form { $('form') }
    remainYes { $('#remainCatC') }
    remainNo { $('#remainCatC-2') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('span.govuk-error-message') }
  }
}
