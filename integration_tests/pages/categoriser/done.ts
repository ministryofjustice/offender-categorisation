import BaseCategorisationPage from './base'

export default class CategorisationDonePage extends BaseCategorisationPage {
  static baseUrl: string = '/categorisationDone'

  constructor() {
    super('Prisoner Categorisation')
  }
}
