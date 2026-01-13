import Page, { PageElement } from '../page'

type StringArray = [string, ...string[]][]
type ChangeHistoryTableData = StringArray

const SELECTORS = {
  BUTTON: {
    NEXT_REVIEW_DATE: '#nextReviewDateButton',
  },
}

export default class SupervisorLandingPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/supervisorLanding/${this._bookingId}`
  }

  constructor() {
    super('Check previous category reviews', { checkOnPage: { tag: 'h2' } })
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new SupervisorLandingPage()
  }

  nextReviewDateButton = (): PageElement => cy.get('#nextReviewDateButton')
  paragraphs = (): PageElement => cy.get('p')
  approveButton = (): PageElement => cy.get('#approveButton')
  validateChangeHistoryTableData = (expectedValues: ChangeHistoryTableData) =>
    cy.checkTableRowData<ChangeHistoryTableData>({
      tableRowsSelector: 'table#nextReviewDateTable > tbody > tr',
      expectedValues,
    })
}
