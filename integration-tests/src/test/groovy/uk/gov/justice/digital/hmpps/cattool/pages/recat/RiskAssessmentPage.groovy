package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class RiskAssessmentPage extends Page {

  static url = '/form/recat/riskAssessment'

  static at = {
    headingText == 'Risk assessment'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    headerBlock { $('div.govuk-body-s') }
    headerValue { headerBlock.$('div.govuk-\\!-font-weight-bold') }

    form { $('form') }
    lowerCategory { $('#lowerCategory') }
    higherCategory { $('#higherCategory') }
    otherRelevantYes { $('#otherRelevant') }
    otherRelevantNo { $('#otherRelevant-2') }
    otherRelevantText { $('#otherRelevantText') }

    submitButton { $('button', type: 'submit') }
    backLink { $('a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
  }
}
