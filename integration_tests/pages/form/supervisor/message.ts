import Page, { PageElement } from '../../page'

export type DtDlMessagePair = { question: string; expectedAnswer: string }

export default class SupervisorMessagePage extends Page {
  static get baseUrl(): string {
    return '/form/supervisor/supervisorMessage'
  }

  constructor() {
    super('Message from supervisor')
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  validateMessages = (expected: DtDlMessagePair[] = []) => {
    this.validateDescriptionList('supervisorMessage', expected)
  }
}
