import { PageElement } from '../page'
import BaseLandingPage from '../baseLandingPage'

export default class RecategoriserLandingPage extends BaseLandingPage {
  static baseUrl: string = '/:bookingId'

  constructor() {
    super('Manage category')
  }

  recatButton = (): PageElement => cy.get('#recatButton')
}
