import Page, { PageElement } from '../../page'

const SELECTORS = {
  HEADER: {
    INITIAL_NOTE: '#header-initial-note',
  },
  PARAGRAPH: {
    INITIAL_MANUAL: '#p-initial-manual',
    INITIAL_NOTE: '#p-initial-note',
  },
  INPUT: {
    MORE_DETAIL: '#more-detail',
  },
}

export default class SecurityReviewPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/security/review/${this._bookingId}`
  }

  constructor() {
    super('Security review')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new SecurityReviewPage()
  }

  saveAndSubmitButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and submit')

  validateHeaderInitialNote = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateSelectorExists(SELECTORS.HEADER.INITIAL_NOTE, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.HEADER.INITIAL_NOTE).should('contain.text', expectedText)
    }
  }

  validateParagraphInitialNote = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateSelectorExists(SELECTORS.PARAGRAPH.INITIAL_NOTE, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.PARAGRAPH.INITIAL_NOTE).should('contain.text', expectedText)
    }
  }

  validateParagraphInitialManual = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateSelectorExists(SELECTORS.PARAGRAPH.INITIAL_MANUAL, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.PARAGRAPH.INITIAL_MANUAL).should('contain.text', expectedText)
    }
  }

  setSecurityInformationText = (text: string) => cy.get(SELECTORS.INPUT.MORE_DETAIL).type(text)
}
