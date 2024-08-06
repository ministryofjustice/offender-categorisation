package uk.gov.justice.digital.hmpps.cattool.pages

class SecurityReviewPage extends HeaderPage {

  static String bookingId

  static url = '/form/security/review/' + bookingId

  static at = {
    headingText == 'Security review'
  }

  static content = {
    headerRecatNote { $('#header-recat-note') }
    headerInitialNote { $('#header-initial-note') }
    headerSecInfo { $('#header-sec-info') }

    pFlagged { $('#p-flagged') }
    pInitialManual { $('#p-initial-manual') }
    pInitialNote { $('#p-initial-note') }
    pRecatNote { $('#p-recat-note') }
    pRecatNoNote { $('#p-recat-no-note') }
    pAuto { $('#p-auto') }

    submitButton { $('button.govuk-button', value: 'submit') }
    saveOnlyButton { $('button.govuk-button', value: 'return') }
    securityText { $('textarea', name: 'securityReview') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('.govuk-error-message') }
    recatWarning { $('#recatWarning') }
  }
}
