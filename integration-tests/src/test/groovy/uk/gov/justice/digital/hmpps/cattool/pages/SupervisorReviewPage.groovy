package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorReviewPage extends Page {

  static url = '/form/supervisor/review'

  static at = {
    headingText == 'Review provisional categorisation'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }

    warning { $('div.govuk-warning-text', 0) }
    form { $('form') }

    appropriateYes { $('#supervisorCategoryAppropriate-1') }
    appropriateNo { $('#supervisorCategoryAppropriate-2') }
    overriddenCategoryB(required: false) { $('#overriddenCategoryB') }
    overriddenCategoryC(required: false) { $('#overriddenCategoryC') }
    overriddenCategoryD(required: false) { $('#overriddenCategoryD') }
    changeLinks(required: false) { $('a.govuk-link', text: startsWith('Change')) }
    newCatMessage(required: false) { $('#newCatMessage') }
    overriddenCategoryText(required: false) { $('#supervisorOverriddenCategoryText') }
    indeterminateMessage(required: false) { $('p.govuk-body') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }
    backToCategoriserButton { $('.rightAlignedButton') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
  }
}
