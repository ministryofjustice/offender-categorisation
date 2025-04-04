import Page, { PageElement } from '../page'

const SELECTORS = {
  INFO: '.govuk-inset-text',
  WARNING: '.govuk-warning-text__text',
  AUTHORITY: {
    INPUT: '#authority',
  },
  BUTTON: {
    SUBMIT: '#initialButton',
  },
  CATEGORY: {
    INPUT: 'select#category',
  },
  COMMENT: {
    INPUT: '#comment',
  },
  REASSESSMENT_DATE: {
    INPUT: '#nextReviewDate',
  },
  RECOMMENDED_PLACEMENT: {
    INPUT: '#placement',
  },
}

export default class LiteCategoriesPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/liteCategories/${this._bookingId}`
  }

  constructor() {
    super('Other category assessment')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new LiteCategoriesPage()
  }

  submitButton = (): PageElement => cy.get(SELECTORS.BUTTON.SUBMIT).contains('Submit')

  getAuthority = () => cy.get(SELECTORS.AUTHORITY.INPUT)
  setAuthority = (text: string) => this.getAuthority().select(text)

  getCategory = () => cy.get(SELECTORS.CATEGORY.INPUT)
  setCategory = (text: string) => this.getCategory().select(text)

  getComment = () => cy.get(SELECTORS.COMMENT.INPUT)
  setComment = (text: string) => this.getComment().clear().type(text)

  clearReAssessmentDate = () => this.getReAssessmentDate().clear()
  getReAssessmentDate = () => cy.get(SELECTORS.REASSESSMENT_DATE.INPUT)
  setReAssessmentDate = (text: string) => this.clearReAssessmentDate().type(text)

  getRecommendedPlacement = () => cy.get(SELECTORS.RECOMMENDED_PLACEMENT.INPUT)
  setRecommendedPlacement = (text: string) => this.getRecommendedPlacement().select(text)

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: typeof SELECTORS.REASSESSMENT_DATE.INPUT
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.REASSESSMENT_DATE.INPUT
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateWarningVisibility({ isVisible }: { isVisible: boolean }) {
    cy.get(SELECTORS.WARNING).should(isVisible ? 'exist' : 'not.exist')
  }

  validateWarningText = (expected: string) =>
    cy
      .get(SELECTORS.WARNING)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validateAvailableCategoryOptions = () => {
    const expected = [
      { value: 'U', text: 'Unsentenced' },
      { value: 'Z', text: 'Unclass' },
      { value: 'A', text: 'Cat A' },
      { value: 'E', text: 'Cat A Ex' },
      { value: 'H', text: 'Cat A Hi' },
      { value: 'P', text: 'Prov A' },
      { value: 'V', text: 'YOI Restricted' },
      { value: 'B', text: 'Downgrade A to B' },
      { value: 'D', text: 'Indeterminate Cat D' },
    ]

    this.getCategory()
      .find('option')
      .should('have.length', expected.length)
      .each(option => {
        const value = option.val()
        const text = option.text()

        const matchingOption = expected.find(o => o.value === value && o.text === text)
        expect(matchingOption).to.exist
      })
  }
}
