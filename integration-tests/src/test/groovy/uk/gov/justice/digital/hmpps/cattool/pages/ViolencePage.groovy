package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class ViolencePage extends Page {

  static url = '/form/ratings/violenceRating'

  static at = {
    headingText == 'Violence rating'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('p.govuk-\\!-font-weight-bold') }

    warning(required: false) { $('div.govuk-warning-text') }
    info(required: false) { $('div.govuk-inset-text') }

    form {$('form')}
    highRiskOfViolenceYes {$('#highRiskOfViolence-1')}
    highRiskOfViolenceNo {$('#highRiskOfViolence-2')}
    highRiskOfViolenceText {$('#highRiskOfViolenceText')}
    seriousThreatYes {$('#seriousThreat-1')}
    seriousThreatNo {$('#seriousThreat-2')}
    seriousThreatText {$('#seriousThreatText')}

    submitButton { $('button', type:'submit') }
    backLink { $( 'a.govuk-back-link') }
    errorSummaries {$('ul.govuk-error-summary__list li')}
    errors {$('span.govuk-error-message')}
  }
}
