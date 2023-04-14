import { PageElement } from '../page'
import BaseSecurityPage from './base'

export default class SecurityDonePage extends BaseSecurityPage {
  static baseUrl: string = '/securityDone'

  constructor() {
    super('Prisoner Categorisation')
  }

  viewOffenderDetails = (bookingId: number): PageElement =>
    cy.contains(`a[href="/form/security/view/${bookingId}"]`, 'View').click()
}
