import BaseCategorisationPage from './base'
import { PageElement } from '../page'

export default class CategorisationDonePage extends BaseCategorisationPage {
  static baseUrl: string = '/categorisationDone'

  constructor() {
    super('Prisoner Categorisation')
  }
}
