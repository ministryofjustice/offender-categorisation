import Page, { PageElement } from '../../../page'

export default class RiskAssessmentPage extends Page {
  constructor() {
    super('Risk assessment')
  }

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')
  lowerCategoryInput = () => cy.get('#lowerCategory')
  higherCategoryInput = () => cy.get('#higherCategory')
  otherRelevantTextInput = () => cy.get('#otherRelevantText')
  otherRelevantInformationYes = () => cy.get('#otherRelevant')
  otherRelevantInformationNo = () => cy.get('#otherRelevant-2')
}
