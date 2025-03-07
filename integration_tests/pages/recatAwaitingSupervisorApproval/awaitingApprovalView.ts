import Page, { DtDlQuestionExpectedAnswerPair, PageElement } from '../page'

export default class RecatAwaitingApprovalPage extends Page {
  static baseUrl: string = '/form/awaitingApprovalView'

  constructor() {
    super('Provisional categorisation')
  }

  getCategoryForApproval = (): PageElement => cy.get('#category-div')

  validateEarliestReleaseDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('earliestReleaseDateSummary', [
      { question: 'Earliest release date', expectedAnswer: '' },
      ...expected,
    ])
  }
}
