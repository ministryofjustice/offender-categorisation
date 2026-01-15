import { PageElement } from '../page'
import BaseLandingPage from '../baseLandingPage'

export default class RecategoriserLandingPage extends BaseLandingPage {
  static baseUrl: string = '/:bookingId'

  constructor() {
    super('Check previous category reviews')
  }

  recatButton = (): PageElement => cy.get('#recatButton')
}
