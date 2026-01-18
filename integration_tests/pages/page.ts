import ErrorPage from './error/error'
import { cleanString } from '../support/utilities'

export type PageElement = Cypress.Chainable<JQuery>

type ToDoTableData = [string, string, string, string, string, string, string][]

export type DtDlQuestionExpectedAnswerPair = { question: string; expectedAnswer: string }

interface TextVisibilityOptions {
  selector: string
  text: string
  isVisible?: boolean
}

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(
    private readonly title: string | undefined = undefined,
    private readonly config = { checkOnPage: { tag: 'h1' } },
  ) {
    this.checkOnPage(config.checkOnPage.tag)
  }

  checkOnPage(tag = 'h1'): void {
    if (typeof this.title !== 'undefined') {
      cy.get(tag).contains(this.title)
    }
  }

  checkPageUrl(url: string): void {
    cy.url().should('contain', url)
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  errorSummaries = (): PageElement =>
    cy.get(ErrorPage.ERROR_SUMMARY_TITLE_SELECTOR).contains('There is a problem').get('ul.govuk-error-summary__list li')

  errors = (): PageElement => cy.get('.govuk-error-message')

  multipleRoleDiv = (): PageElement => cy.get('#multiple-role')

  roleSwitchSelect = (): PageElement => cy.get('#roleSwitch')

  switchRole = (role: string): PageElement => this.roleSwitchSelect().select(role)

  validateRadioButtonSelections = (optionSelectors: string[], isChecked: boolean): void =>
    optionSelectors.forEach(optionSelector =>
      cy.get(optionSelector).should(isChecked ? 'be.checked' : 'not.be.checked'),
    )

  validateSelectorExists = (selector: string, exists: boolean) =>
    cy.get(selector).should(exists ? 'exist' : 'not.exist')

  validateSelectorVisibility = (selector: string, isVisible: boolean) =>
    cy.get(selector).should(isVisible ? 'be.visible' : 'not.be.visible')

  validateErrorSummaryMessages(errorSummaryMessages: { index: number; href: string; text: string }[]) {
    errorSummaryMessages.forEach(({ index, href, text }) => {
      this.errorSummaries().eq(index).find('a').should('have.attr', 'href', href).should('have.text', text)
    })
  }

  validateErrorMessages(errorMessages: { selector: string; text: string }[]) {
    errorMessages.forEach(({ selector, text }) => {
      cy.get(selector).should('contain.text', text)
    })
  }

  validateToDoTableData = (expectedValues: ToDoTableData) =>
    cy.checkTableRowData<ToDoTableData>({
      tableRowsSelector: 'table#offenderTable > tbody > tr',
      expectedValues,
    })

  assertTextVisibilityOnPage = (options: TextVisibilityOptions): PageElement => {
    const { selector, text, isVisible = true } = options
    const visibilityAssertion = isVisible ? 'be.visible' : 'not.exist'

    return cy.contains(selector, text).should(visibilityAssertion)
  }

  fallbackHeader = (): PageElement => cy.get('[data-qa=cat-tool-fallback-header]')

  fallbackFooter = (): PageElement => cy.get('[data-qa=cat-tool-fallback-footer]')

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  mockDpsComponentHeader = (): PageElement => cy.get('.connect-dps-common-header')

  mockDpsComponentFooter = (): PageElement => cy.get('.connect-dps-common-footer')

  protected _cleanString = cleanString

  validateDescriptionList = (selector: string, expected: DtDlQuestionExpectedAnswerPair[]) => {
    cy.get(`dl.${selector}`).within(() => {
      cy.get('dt').each((dt, index) => {
        const questionText = dt.text().trim()

        cy.wrap(dt)
          .next('dd')
          .invoke('text')
          .then(answerText => {
            const expectedPair = expected[index]

            expect(questionText).to.eq(expectedPair.question)
            expect(this._cleanString(answerText)).to.eq(expectedPair.expectedAnswer)
          })
      })
    })
  }

  checkPrisonerReviewGuidance = (): void => {
    cy.get('.govuk-details').within(() => {
      cy.get('.govuk-details__summary-text').should('contain.text', 'How to choose a date for a prisoner')

      const expectedTexts = [
        'The date you set should be in line with policy guidance.',
        "It depends on the prisoner's sentence type and how long they have left in custody.",
        'Determinate sentence with 3 or more years left in custody',
        'They should be reviewed within the next 12 months.',
        'Determinate sentence with less than 3 years left in custody',
        'They should be reviewed within the next 6 months.',
        'Indeterminate prison sentence',
        'They should be reviewed within the next 3 years.',
      ]

      expectedTexts.forEach(text => {
        cy.get('.govuk-details__text').should('contain.text', text)
      })
    })
  }

  checkConditionalReleaseDateInsetText = (isoDate: string): void => {
    const dateParts = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(new Date(isoDate))

    // GOV.UK style: no comma after weekday
    const formattedDate = [
      dateParts.find(p => p.type === 'weekday')?.value,
      dateParts.find(p => p.type === 'day')?.value,
      dateParts.find(p => p.type === 'month')?.value,
      dateParts.find(p => p.type === 'year')?.value,
    ].join(' ')

    cy.contains(`Conditional release date: ${formattedDate}`)
  }
}
