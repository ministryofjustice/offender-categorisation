import Page, { PageElement } from '../../page'

const previousConditionsRadioChoiceHtmlSelectors = {
  YES: '#previousConvictions',
  NO: '#previousConvictions-2',
} as const

type PreviousConditionsChoice = keyof typeof previousConditionsRadioChoiceHtmlSelectors

export default class CategoriserOffendingHistoryPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/offendingHistory/${this._bookingId}`
  }

  constructor() {
    super('Offending history')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserOffendingHistoryPage()
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  selectPreviousConditionsRadioButton = (selectedTextValue: PreviousConditionsChoice): PageElement =>
    cy.get(previousConditionsRadioChoiceHtmlSelectors[selectedTextValue]).click()

  validatePreviousConvictionRadioButtons = ({
    selection,
    isChecked,
  }: {
    selection: PreviousConditionsChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => previousConditionsRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked
    )

  validateExpectedCatAWarning = (expected: string) =>
    cy
      .get('.govuk-warning-text__text')
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validateCatAInfoVisibility = ({ isVisible }: { isVisible: boolean }) =>
    cy.get('.govuk-inset-text').should(isVisible ? 'exist' : 'not.exist')

  validateExpectedConvictions = (convictions: string[]) =>
    cy
      .get('.govuk-body-s.forms-comments-text ul li')
      .each(($li, index) => expect(this._cleanString($li.text())).to.contain(convictions[index]))

  validatePreviousConvictionsTextBox = ({ expectedText, isVisible }: { expectedText?: string; isVisible: boolean }) => {
    cy.get('#previousConvictionsText').should(isVisible ? 'be.visible' : 'not.be.visible')

    if (isVisible) {
      cy.get('#previousConvictionsText').should('contain.text', expectedText)
    }
  }

  setPreviousConvictionsText = (text: string) => cy.get('#previousConvictionsText').type(text)
}
