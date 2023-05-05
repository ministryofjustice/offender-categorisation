import BaseCategorisationPage from './base'

export default class CategorisationHomePage extends BaseCategorisationPage {
  static baseUrl: string = '/categorisationHome'

  constructor() {
    super('Prisoner Categorisation')
  }

  selectPrisonerWithBookingId(bookingId: number) {
    cy.contains(`a[href="/tasklist/${bookingId}"]`, 'Start').click()
  }
}
