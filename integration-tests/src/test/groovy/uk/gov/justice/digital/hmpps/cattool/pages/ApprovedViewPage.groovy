package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class ApprovedViewPage extends Page {

  static url = '/form/approvedView'

  static at = {
    headingText == 'Categorisation outcome'
  }

  static content = {
    headingText { $('h1.mainHeading').text() }
    headerBlock { $('div.govuk-grid-column-one-third') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }
    categories { $('.govuk-warning-text') }
    commentLabel(required: false) { $('label', text:'Comments')}
    comments(required: false) { $('.forms-comments-text') }
    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }

    openConditionsHeader(required: false) { $('.openConditionsHeader') }

    otherInformationSummary { $('.otherInformationSummary .govuk-summary-list__value') }

    submitButton { $('a', role:'button') }
    backLink { $('a.govuk-back-link') }
  }
}
