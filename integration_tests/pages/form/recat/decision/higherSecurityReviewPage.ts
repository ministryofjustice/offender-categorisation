import Page, { PageElement } from "../../../page";

export default class HigherSecurityReviewPage extends Page {
  constructor() {
    super('Higher Security Review')
  }

  submitButton = (): PageElement => cy.get('button[type="submit"]')
  behaviourSuggestingHigherCategoryReviewInput = () => cy.get('#behaviour')
  stepsTakenToManageBehaviourInput = () => cy.get('#steps')
  answerNoToCouldBehaviourBeManagedInAnotherPrison = () => cy.get('#transfer-2')
  reasonWhyInput = () => cy.get('#transferText')
  whatConditionsAreNecessary = () => cy.get('#conditions')
}
