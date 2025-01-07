import Page from '../page'
import BaseApprovedViewPage from './baseApprovedView'

export default class RecatApprovedViewPage extends BaseApprovedViewPage {
  static baseUrl: string = '/form/approvedView'

  constructor() {
    super('Categorisation review outcome')
  }
}
