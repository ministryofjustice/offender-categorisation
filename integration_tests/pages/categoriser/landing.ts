import Page, { PageElement } from '../page'

type StringArray = [string, ...string[]][]
type ChangeHistoryTableData = StringArray

const SELECTORS = {
  BUTTON: {
    NEXT_REVIEW_DATE: '#nextReviewDateButton',
  },
}

export default class CategoriserLandingPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/categoriserLanding/${this._bookingId}`
  }

  constructor() {
    super('Check previous category reviews')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserLandingPage()
  }

  changeReviewDateButton = (): PageElement => cy.get(SELECTORS.BUTTON.NEXT_REVIEW_DATE).contains('Change review date')

  validateChangeHistoryTableData = (expectedValues: ChangeHistoryTableData) =>
    cy.checkTableRowData<ChangeHistoryTableData>({
      tableRowsSelector: 'table#nextReviewDateTable > tbody > tr',
      expectedValues,
    })

  validateNextReviewDateButtonExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.BUTTON.NEXT_REVIEW_DATE, exists)
}
