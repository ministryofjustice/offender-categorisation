import BaseCategoriserPage from './base'
import { PageElement } from '../page'

export default class CategoriserAwaitingApprovalViewPage extends BaseCategoriserPage {
  static baseUrl: string = '/form/awaitingApprovalView'

  constructor() {
    super('Provisional categorisation')
  }

  warning = (): PageElement => cy.get('div.govuk-warning-text')
}
