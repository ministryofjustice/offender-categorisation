import BaseSupervisorPage from './base'

export default class SupervisorHomePage extends BaseSupervisorPage {
  constructor() {
    super('Prisoner Categorisation Approvals')
  }

  startReviewForPrisoner = (bookingId: number) =>
    cy.get(`a[href="/form/supervisor/review/${bookingId}"`).should('contain.text', 'Start').click()
}
