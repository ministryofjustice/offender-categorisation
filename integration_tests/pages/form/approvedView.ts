import Page, {PageElement} from '../page'
import BaseApprovedViewPage from './baseApprovedView'

export default class ApprovedViewPage extends BaseApprovedViewPage {
  static baseUrl: string = '/form/approvedView'

  constructor() {
    super('Categorisation outcome')
  }

  otherInformationSummary = (): PageElement => cy.get('.otherInformationSummary .govuk-summary-list__value')

  commentLabel = (): PageElement => cy.get('label')

/*
  commentLabel(required: false) { $('label', text:'Comments')}
*/

}
