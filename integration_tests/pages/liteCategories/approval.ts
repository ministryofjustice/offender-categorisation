import Page, { PageElement } from '../page'

const SELECTORS = {
  APPROVAL_DATE: {
    INPUT: '#approvedDate',
    ERROR: '#approvedDate-error',
  },
  DEPARTMENT: {
    INPUT: '#approvedCommittee',
  },
  APPROVED_CATEGORY: {
    INPUT: '#supervisorCategory',
    COMMENT: { INPUT: '#approvedCategoryComment' },
  },
  APPROVED_PLACEMENT: { INPUT: '#approvedPlacement', COMMENT: { INPUT: '#approvedPlacementComment' } },
  APPROVED_COMMENT: { INPUT: '#approvedComment' },
  NEXT_REVIEW_DATE: { INPUT: '#nextReviewDate' },
  BUTTON: {
    SUBMIT: 'button',
  },
}

export default class LiteCategoriesApprovalPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/liteCategories/approve/${this._bookingId}`
  }

  constructor() {
    super('Other category approval')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new LiteCategoriesApprovalPage()
  }

  clearApprovalDate = () => this.getApprovalDate().clear()
  getApprovalDate = () => cy.get(SELECTORS.APPROVAL_DATE.INPUT)
  setApprovalDate = (text: string) => this.clearApprovalDate().type(text)

  getDepartment = () => cy.get(SELECTORS.DEPARTMENT.INPUT)
  setDepartment = (text: string) => this.getDepartment().select(text)

  getApprovedCategory = () => cy.get(SELECTORS.APPROVED_CATEGORY.INPUT)
  setApprovedCategory = (text: string) => this.getApprovedCategory().select(text)

  clearApprovedCategoryComment = () => this.getApprovedCategoryComment().clear()
  getApprovedCategoryComment = () => cy.get(SELECTORS.APPROVED_CATEGORY.COMMENT.INPUT)
  setApprovedCategoryComment = (text: string) => this.clearApprovedCategoryComment().type(text)

  getApprovedPlacement = () => cy.get(SELECTORS.APPROVED_PLACEMENT.INPUT)
  setApprovedPlacement = (text: string) => this.getApprovedPlacement().select(text)

  clearApprovedPlacementComment = () => this.getApprovedPlacementComment().clear()
  getApprovedPlacementComment = () => cy.get(SELECTORS.APPROVED_PLACEMENT.COMMENT.INPUT)
  setApprovedPlacementComment = (text: string) => this.clearApprovedPlacementComment().type(text)

  clearApprovedComment = () => this.getApprovedComment().clear()
  getApprovedComment = () => cy.get(SELECTORS.APPROVED_COMMENT.INPUT)
  setApprovedComment = (text: string) => this.clearApprovedComment().type(text)

  clearNextReviewDate = () => this.getNextReviewDate().clear()
  getNextReviewDate = () => cy.get(SELECTORS.NEXT_REVIEW_DATE.INPUT)
  setNextReviewDate = (text: string) => this.clearNextReviewDate().type(text)

  submitButton = (): PageElement => cy.get(SELECTORS.BUTTON.SUBMIT).contains('Submit')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: typeof SELECTORS.APPROVAL_DATE.INPUT
      text: string
    }[]
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.APPROVAL_DATE.ERROR
      text: string
    }[]
  ) {
    super.validateErrorMessages(errorMessages)
  }
}
