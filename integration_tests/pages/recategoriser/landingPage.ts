import Page, { PageElement } from '../page'

export default class RecategoriserLandingPage extends Page {
  static baseUrl: string = '/:bookingId'

  constructor() {
    super('Check previous category reviews')
  }

  initialButton = (): PageElement => cy.get('#initialButton')
  recatButton = (): PageElement => cy.get('#recatButton')
  viewButton = (): PageElement => cy.get('#viewButton')
  editButton = (): PageElement => cy.get('#editButton')
  approveButton = (): PageElement => cy.get('#approveButton')
  nextReviewDateButton = (): PageElement => cy.get('#nextReviewDateButton')
  historyButton = (): PageElement => cy.get('#historyButton')
  securityButton = (): PageElement => cy.get('#securityButton')
  liteCategoriesButton = (): PageElement => cy.get('#liteCategoriesButton')

  securityCancelLink = (): PageElement => cy.get('a#securityCancelLink')

  historyHeading = (): PageElement => cy.get('#previousCategoryHeading')
  warning = (): PageElement => cy.get('div.govuk-warning-text')
  paragraphs = (): PageElement => cy.get('p')

  nextReviewDate = (): PageElement => cy.get('.data-qa-nextReviewDate')
  nextReviewDateHistory = (): PageElement => cy.get('#nextReviewDateTable > tbody > tr')
}
