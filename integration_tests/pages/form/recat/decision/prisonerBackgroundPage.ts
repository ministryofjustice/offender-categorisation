import Page, { PageElement } from '../../../page'

export default class PrisonerBackgroundPage extends Page {
  constructor() {
    super('Prisoner background')
  }

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')
  offenceDetailsInput = () => cy.get('#offenceDetails')
  previousCategoryReviewsLink = () => cy.get('#historyLink').contains('Previous categorisation assessments')
}
