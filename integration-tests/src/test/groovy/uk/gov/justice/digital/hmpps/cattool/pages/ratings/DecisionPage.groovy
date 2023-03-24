package uk.gov.justice.digital.hmpps.cattool.pages.ratings

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class DecisionPage extends HeaderPage {

  static url = '/form/ratings/decision'

  static at = {
    headingText == 'Category decision'
  }

  static content = {
    form { $('form') }
    behaviour { $('#behaviour') }
    openOption { $('#openOption') }
    closedOption { $('#closedOption') }
    yoiClosedOption{ $('#catIOption')}
    yoiOpenOption{ $('#catJOption')}
    hints { $('.govuk-radios__hint') }
    submitButton { $('button', type: 'submit') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }  }
}
