import BaseCategoriserPage from './base'

export default class CategoriserDonePage extends BaseCategoriserPage {
  static baseUrl: string = '/categorisationDone'

  constructor() {
    super('Prisoner Categorisation')
  }
}
