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

    submitButton { $('button', type:'submit') }
    backLink { $( 'a.govuk-back-link') }
  }
}
