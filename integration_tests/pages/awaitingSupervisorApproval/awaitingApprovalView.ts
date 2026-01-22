import Page, { DtDlQuestionExpectedAnswerPair, PageElement } from '../page'

export default class AwaitingApprovalPage extends Page {
  static baseUrl: string = '/form/awaitingApprovalView'

  constructor() {
    super('Provisional categorisation')
  }

  getCategoryForApproval = (): PageElement => cy.get('#category-div')

  validateEarliestReleaseDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('earliestReleaseDateSummary', [...expected])
  }

  cancelLink = (): PageElement => cy.get('#cancelLink')
}
