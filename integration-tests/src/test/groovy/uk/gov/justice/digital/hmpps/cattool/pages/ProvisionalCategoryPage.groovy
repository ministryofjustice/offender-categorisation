package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class ProvisionalCategoryPage extends Page {

  static url = '/form/categoriserConfirmation/provisionalCategory'

  static at = {
    headingText == 'Provisional category'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }

    form {$('form')}
    appropriateYes {$('#categoryAppropriate-1')}
    appropriateNo {$('#categoryAppropriate-2')}
    overriddenCategoryB {$('#overriddenCategory-1')}
    overriddenCategoryC {$('#overriddenCategory-2')}
    overriddenCategoryD {$('#overriddenCategory-3')}
    overriddenCategoryText {$('#overriddenCategoryText')}
    submitButton { $('button', type:'submit') }
    backLink { $( 'a.govuk-back-link') }
    errorSummaries {$('ul.govuk-error-summary__list li')}
    errors {$('span.govuk-error-message')}
  }
}
