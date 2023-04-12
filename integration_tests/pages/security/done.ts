import Page, { PageElement } from '../page'

export default class SecurityDonePage extends Page {
  constructor() {
    super('Prisoner Categorisation')
  }

  viewOffenderDetails = (bookingId: number): PageElement =>
    cy.contains(`a[href="/form/security/view/${bookingId}"]`, 'View').click()
}
