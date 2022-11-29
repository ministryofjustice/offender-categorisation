package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class LandingPage extends Page {

  static at = {
    historyHeading.text() == 'Check previous category reviews'
  }

  static content = {
    initialButton(required: false) { $('#initialButton') }
    recatButton(required: false) { $('#recatButton') }
    viewButton(required: false) { $('#viewButton') }
    editButton(required: false) { $('#editButton') }
    approveButton(required: false) { $('#approveButton') }
    nextReviewDateButton(required: false) { $('#nextReviewDateButton') }
    warning(required: false) { $('div.govuk-warning-text') }
    historyButton { $('#historyButton') }
    historyHeading { $('#previousCategoryHeading') }
    securityButton(required: false) { $('#securityButton') }
    securityCancelLink(required: false) { $('a#securityCancelLink') }
    paragraphs { $('p') }
    //liteCategoriesButton(required: false) { $('#liteCategoriesButton') }
    liteCategoriesButton(required: false) { $('#initialButton') }
    nextReviewDate(required: false) { $('.data-qa-nextReviewDate') }
    nextReviewDateHistory(required: false) { $('#nextReviewDateTable > tbody > tr') }
  }
}
