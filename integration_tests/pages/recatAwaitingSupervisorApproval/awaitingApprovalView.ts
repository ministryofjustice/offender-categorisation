import Page, { DtDlQuestionExpectedAnswerPair, PageElement } from '../page'
import { LOW_RISK_OF_ESCAPE } from '../../../server/services/recategorisation/filter/recategorisationFilter'

export default class RecatAwaitingApprovalPage extends Page {
  static baseUrl: string = '/form/awaitingApprovalView'

  constructor() {
    super('Provisional categorisation')
  }

  getCategoryForApproval = (): PageElement => cy.get('#category-div')

  validateEarliestReleaseDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('earliestReleaseDateSummary', [
      ...expected,
    ])
  }
}
