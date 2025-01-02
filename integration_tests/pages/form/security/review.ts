import Page, { PageElement } from '../../page'

const SELECTORS = {
  HEADER: {
    INITIAL_NOTE: '#header-initial-note',
    RECAT_NOTE: '#header-recat-note',
  },
  PARAGRAPH: {
    INITIAL_MANUAL: '#p-initial-manual',
    INITIAL_NOTE: '#p-initial-note',
    RECAT_NOTE: '#p-recat-note',
    RECAT_NO_NOTE: '#p-recat-no-note',
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
  saveButton = (): PageElement => cy.get('[data-qa="save-review"]').contains('Save')

  validateHeaderInitialNote = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateSelectorExists(SELECTORS.HEADER.INITIAL_NOTE, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.HEADER.INITIAL_NOTE).should('contain.text', expectedText)
    }
  }

  validateHeaderRecatNote = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateSelectorExists(SELECTORS.HEADER.RECAT_NOTE, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.HEADER.RECAT_NOTE).should('contain.text', expectedText)
    }
  }

  private validateParagraphNote = (selector: string, isVisible: boolean, expectedText?: string) => {
    this.validateSelectorExists(selector, isVisible)

    if (isVisible) {
      cy.get(selector).should('contain.text', expectedText)
    }
  }

  validateParagraphInitialNote = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateParagraphNote(SELECTORS.PARAGRAPH.INITIAL_NOTE, isVisible, expectedText)
  }

  validateParagraphRecatNote = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateParagraphNote(SELECTORS.PARAGRAPH.RECAT_NOTE, isVisible, expectedText)
  }

  validateNoParagraphRecatNote = () => {
    this.validateParagraphNote(SELECTORS.PARAGRAPH.RECAT_NO_NOTE, true, 'A note was not added')
  }

  validateParagraphInitialManual = ({ isVisible, expectedText }: { isVisible: boolean; expectedText?: string }) => {
    this.validateParagraphNote(SELECTORS.PARAGRAPH.INITIAL_MANUAL, isVisible, expectedText)
  }

  setSecurityInformationText = (text: string) => cy.get(SELECTORS.INPUT.MORE_DETAIL).type(text)
}
