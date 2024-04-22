import BaseRecategoriserPage from './base'

export default class RecategoriserHomePage extends BaseRecategoriserPage {
  static baseUrl: string = '/recategoriserHome'

  constructor() {
    super('Category reviews for prisoners')
  }
}
