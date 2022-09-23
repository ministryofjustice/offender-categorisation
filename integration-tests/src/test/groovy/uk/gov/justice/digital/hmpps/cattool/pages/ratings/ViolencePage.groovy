package uk.gov.justice.digital.hmpps.cattool.pages.ratings

import uk.gov.justice.digital.hmpps.cattool.pages.HeaderPage

class ViolencePage extends HeaderPage {

  static url = '/form/ratings/violenceRating'

  static at = {
    headingText == 'Safety and good order'
  }

  static content = {
    warning(required: false) { $('div.govuk-warning-text') }
    info(required: false) { $('div.govuk-inset-text') }

    form {$('form')}
    highRiskOfViolenceYes {$('#highRiskOfViolence')}
    highRiskOfViolenceNo {$('#highRiskOfViolence-2')}
    highRiskOfViolenceText {$('#highRiskOfViolenceText')}
    seriousThreatYes {$('#seriousThreat')}
    seriousThreatNo {$('#seriousThreat-2')}
    seriousThreatText {$('#seriousThreatText')}

    submitButton { $('button', type:'submit') }
    backLink { $( 'a.govuk-back-link') }
    errorSummaries {$('ul.govuk-error-summary__list li')}
    errors {$('.govuk-error-message')}
  }
}
