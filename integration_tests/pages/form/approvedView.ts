import Page from '../page'
import BaseApprovedViewPage from './baseApprovedView'

export default class ApprovedViewPage extends BaseApprovedViewPage {
  static baseUrl: string = '/form/approvedView'

  constructor() {
    super('Categorisation outcome')
  }
}
