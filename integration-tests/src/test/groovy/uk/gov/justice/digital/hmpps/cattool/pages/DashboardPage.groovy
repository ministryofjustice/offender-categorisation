package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

abstract class DashboardPage extends Page {

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    form { $('form') }
    submitButton { $('button', type: 'submit') }

    securityTableRows { $('table#security > tbody > tr') }

    timelineTableRows { $('table#timeline > tbody > tr') }
    completionTableRows { $('table#completion > tbody > tr') }

    errorSummaries(required: false) { $('ul.govuk-error-summary__list li') }
    errors(required: false) { $('span.govuk-error-message') }
  }
}
