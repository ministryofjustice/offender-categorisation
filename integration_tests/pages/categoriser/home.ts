import BaseCategorisationPage from './base'

export default class CategorisationHomePage extends BaseCategorisationPage {
  static baseUrl: string = '/categorisationHome'

  constructor() {
    super('Prisoner Categorisation')
  }
}
