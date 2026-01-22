import Page, { PageElement } from './page'

type StringArray = [string, ...string[]][]
type ChangeHistoryTableData = StringArray

const SELECTORS = {
  BUTTON: {
    LITE_CATEGORIES: '#liteCategoriesButton',
    NEXT_REVIEW_DATE: '#nextReviewDateButton',
    INITIAL: '#initialButton',
    VIEW: '#viewButton',
    EDIT: '#editButton',
    RECAT: '#recatButton',
    APPROVE: '#approveButton',
  },
}

export default abstract class BaseLandingPage extends Page {
  changeReviewDateButton = (): PageElement => cy.get(SELECTORS.BUTTON.NEXT_REVIEW_DATE).contains('Change review date')
  liteCategoriesButton = (): PageElement => cy.get(SELECTORS.BUTTON.LITE_CATEGORIES).contains('Change category')

  nextReviewDateText = (): PageElement => cy.get('.data-qa-nextReviewDate')
  warning = (): PageElement => cy.get('div.govuk-warning-text')

  validateChangeHistoryTableData = (expectedValues: ChangeHistoryTableData) =>
    cy.checkTableRowData<ChangeHistoryTableData>({
      tableRowsSelector: 'table#nextReviewDateTable > tbody > tr',
      expectedValues,
    })

  validateNextReviewDateButtonExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.BUTTON.NEXT_REVIEW_DATE, exists)

  validateInitialButtonExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.BUTTON.INITIAL, exists)

  validateViewButtonExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.BUTTON.VIEW, exists)

  validateEditButtonExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.BUTTON.EDIT, exists)

  validateRecatButtonExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.BUTTON.RECAT, exists)

  validateApproveButtonExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.BUTTON.APPROVE, exists)
}
