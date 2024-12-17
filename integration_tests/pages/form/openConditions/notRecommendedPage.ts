// package uk.gov.justice.digital.hmpps.cattool.pages.openConditions
//
// import geb.Page
//
// class NotRecommendedPage extends Page {
//
//   static url = '/form/openConditions/notRecommended'
//
//   static at = {
//     headingText == 'Open conditions not recommended'
//   }
//
//   static content = {
//     headingText { $('h1.govuk-heading-l').text() }
//     form { $('form') }
//     stillReferYes { $('#stillRefer') }
//     stillReferNo { $('#stillRefer-2') }
//
//     reasons { $('#notRecommendedList').find('li') }
//     submitButton { $('button', type: 'submit') }
//
//     errorSummaries { $('ul.govuk-error-summary__list li') }
//     errors { $('.govuk-error-message') }
//   }
// }

import Page, { PageElement } from '../../page'

const stillReferRadioChoiceHtmlSelectors = {
  YES: '#stillRefer',
  NO: '#stillRefer-2',
} as const

type StillReferChoice = keyof typeof stillReferRadioChoiceHtmlSelectors
type StillReferChoiceValues =
  | typeof stillReferRadioChoiceHtmlSelectors.YES
  | typeof stillReferRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  REASONS_NOT_SUITABLE: {
    LIST: '#notRecommendedList > li',
  },
  STILL_REFER: {
    ERROR: '#stillRefer-error',
  },
}

export default class OpenConditionsNotRecommended extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/notRecommended/${this._bookingId}`
  }

  constructor() {
    super('Open conditions not recommended')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new OpenConditionsNotRecommended()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: StillReferChoiceValues
      text: string
    }[]
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.STILL_REFER.ERROR
      text: string
    }[]
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateStillReferRadioButton = ({ selection, isChecked }: { selection: StillReferChoice[]; isChecked: boolean }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => stillReferRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked
    )

  selectStillReferRadioButton = (selectedTextValue: StillReferChoice): PageElement =>
    cy.get(stillReferRadioChoiceHtmlSelectors[selectedTextValue]).click()

  validateNotSuitableReasons = (reasonsNotSuitable: string[]) =>
    cy
      .get(SELECTORS.REASONS_NOT_SUITABLE.LIST)
      .each(($li, index) => expect(this._cleanString($li.text())).to.contain(reasonsNotSuitable[index]))
}
