import { PageElement } from '../page'
import BaseApprovedViewPage from './baseApprovedView'

export default class ApprovedViewPage extends BaseApprovedViewPage {
  static baseUrl: string = '/form/approvedView'

  constructor() {
    super('Categorisation outcome')
  }

  comments = (): PageElement => cy.get('.forms-comments-text')

  commentLabel = (): PageElement => cy.get('label')

  otherInformationSummary = (): PageElement => cy.get('.otherInformationSummary .govuk-summary-list__value')
}
