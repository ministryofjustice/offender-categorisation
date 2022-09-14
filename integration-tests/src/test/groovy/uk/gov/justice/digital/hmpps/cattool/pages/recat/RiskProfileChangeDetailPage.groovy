package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class RiskProfileChangeDetailPage extends Page {

  static url = '/form/recat/riskProfileChangeDetail'

  static at = {
    headingText == 'Check change in risk status'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }

    form {$('form')}

    answerYes { $('#confirmation') }
    answerNo { $('#confirmation-2') }
    messageText {$('#messageText')}

    escapeWarning {$('#escapeWarning')}
    escapeAlerts {$('#escapeAlerts')}
    escapeAlertsOld {$('#escapeAlertsOld')}
    violenceWarningOld {$('#violenceWarningOld')}
    violenceWarningNew {$('#violenceWarningNew')}
    violenceNotifyWarning {$('#notifyCTViolenceWarning')}
    securityWarning {$('#securityReferralWarning')}

    submitButton { $('button', type:'submit') }
    backLink { $( 'a.govuk-back-link') }
    errorSummaries { $('ul.govuk-error-summary__list li') }
    errors { $('govuk-error-message') }
  }
}
