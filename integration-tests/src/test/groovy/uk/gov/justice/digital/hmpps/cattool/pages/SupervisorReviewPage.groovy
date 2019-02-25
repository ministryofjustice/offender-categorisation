package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorReviewPage extends Page {

  static url = '/form/supervisor/review'

  static at = {
    headingText == 'Review provisional categorisation'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }

    form {$('form')}

    appropriateYes { $('#supervisorCategoryAppropriate-1') }
    appropriateNo { $('#supervisorCategoryAppropriate-2') }
    overriddenCategoryB(required: false) { $('#overriddenCategoryB') }
    overriddenCategoryC(required: false) { $('#overriddenCategoryC') }
    overriddenCategoryD(required: false) { $('#overriddenCategoryD') }
    catJMessage(required: false) { $('h2.govuk-heading-m') }
    overriddenCategoryText(required: false) { $('#supervisorOverriddenCategoryText') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }

    submitButton { $('button', type:'submit') }
    backLink { $( 'a.govuk-back-link') }
  }
}
