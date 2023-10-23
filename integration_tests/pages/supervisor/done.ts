import BaseSupervisorPage from './base'
import { PageElement } from '../page'

export default class SupervisorDonePage extends BaseSupervisorPage {
  static baseUrl: string = '/supervisorDone'

  constructor() {
    super('Prisoner Categorisation Approvals')
  }

  viewApprovedPrisonerButton = ({
    bookingId,
    sequenceNumber = 1,
  }: {
    bookingId: number
    sequenceNumber?: number
  }): PageElement => cy.get(`a.govuk-button[href="/form/approvedView/${bookingId}?sequenceNo=${sequenceNumber}"]`)
}
