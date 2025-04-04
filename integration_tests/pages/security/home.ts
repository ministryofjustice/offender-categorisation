import BaseSecurityPage from './base'
import { PageElement } from '../page'

export default class SecurityHomePage extends BaseSecurityPage {
  static baseUrl: string = '/securityHome'

  constructor() {
    super('Categorisation referrals')
  }

  validateCategorisationReferralsToDoTableColumnData = (
    expectedData: { columnName: string; expectedValues: string[] }[],
  ) => expectedData.forEach(cy.checkTableColumnTextValues)

  getStartButton = ({ bookingId }: { bookingId: number }): PageElement =>
    cy.get(`a.govuk-button[href="/form/security/review/${bookingId}"]`)

  validateNoReferralsToReview = () =>
    cy.get('#no-results-message').should('have.text', 'There are no referrals to review.')
}
