import BaseCategoriserPage from './base'

export default class CategoriserHomePage extends BaseCategoriserPage {
  static baseUrl: string = '/categoriserHome'

  constructor() {
    super('Prisoner Categorisation')
  }

  selectPrisonerWithBookingId(bookingId: number, expectedButtonText = 'Start') {
    cy.contains(`a[href="/tasklist/${bookingId}"]`, expectedButtonText).click()
  }
}
