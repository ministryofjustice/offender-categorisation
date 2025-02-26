import moment from 'moment'
import { CATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import Page from '../pages/page'
import CategoriserHomePage from '../pages/categoriser/home'
import { CASELOAD } from '../factory/caseload'
import dbSeeder from '../fixtures/db-seeder'
import initialCategorisation from '../fixtures/categoriser/home'
import { get10BusinessDays } from '../support/utilities'

describe('Categoriser Home page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  it('should be inaccessible to users without CATEGORISER_USER', () => {
    cy.stubLogin({
      user: SECURITY_USER,
    })
    cy.signIn()
    cy.request({
      url: CategoriserHomePage.baseUrl,
      failOnStatusCode: false,
    }).then(resp => {
      expect(resp.status).to.eq(403)
    })
  })

  describe('when the user has the required role', () => {
    beforeEach(() => {
      cy.task('stubGetMyCaseloads', { caseloads: [CASELOAD.LEI] })
      cy.task('stubGetStaffDetailsByUsernameList', {
        usernames: [CATEGORISER_USER.username, SUPERVISOR_USER.username],
      })
    })

    it('should show the no results message by default', () => {
      cy.task('stubUncategorised')
      cy.task('stubGetPrisonerSearchPrisoners')
      cy.task('stubSentenceData', {
        offenderNumbers: [],
        bookingIds: [],
        startDates: [],
      })

      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()

      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.noResultsDiv().should('be.visible')
    })

    it('should show upcoming categorisations', () => {
      dbSeeder(initialCategorisation)

      const offenderNumbers = [
        'B0031AA',
        'B0032AA',
        'B0033AA',
        'B0034AA',
        'B0035AA',
        'B0036AA',
        'B0037AA',
        'B0038AA',
        'B0039AA',
        'B0040AA',
      ]
      const bookingIds = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
      const startDates = [
        moment().subtract(55, 'days'),
        moment().subtract(50, 'days'),
        moment().subtract(47, 'days'),
        moment().subtract(43, 'days'),
        moment().subtract(39, 'days'),
        moment().subtract(15, 'days'),
        moment().subtract(14, 'days'),
        moment().subtract(5, 'days'),
        moment().subtract(1, 'days'),
        moment().subtract(70, 'days'),
      ]

      cy.task('stubUncategorisedFull')
      cy.task('stubGetPrisonerSearchPrisoners')
      cy.task('stubSentenceData', {
        offenderNumbers,
        bookingIds,
        startDates,
      })

      cy.task('stubGetOffenderDetails', {
        basicInfo: true,
        bookingId: 40,
        offenderNo: 'B0040AA',
      })

      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()

      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.validateToDoTableData([
        [
          moment(startDates[8]).add(get10BusinessDays(startDates[8]), 'days').format('DD/MM/yyyy'),
          'Supervisor_back, AwaitingB0039AA',
          '1',
          'REJECTED BYSUPERVISOR',
          'Engelbert Humperdinck',
          'Edit',
        ],
        ['56 days overdue', 'Hillmob, AntB0040AA', '70', 'Started (Api User)', '', 'Edit'],
        ['41 days overdue', 'Missing, AwaitingB0031AA', '55', 'Awaiting approval', 'Engelbert Humperdinck', 'PNOMIS'],
        ['36 days overdue', 'Started, AwaitingB0032AA', '50', 'Started (Api User)', 'Engelbert Humperdinck', 'PNOMIS'],
        ['33 days overdue', 'Awaiting, AwaitingB0033AA', '47', 'Awaiting approval', 'Engelbert Humperdinck', 'View'],
        ['29 days overdue', 'Approved, AwaitingB0034AA', '43', 'Approved', 'Engelbert Humperdinck', 'PNOMIS'],
        ['25 days overdue', 'Missing, UncategorisedB0035AA', '39', 'Not categorised', 'Engelbert Humperdinck', 'Start'],
        ['1 day overdue', 'Started, UncategorisedB0036AA', '15', 'Started (Api User)', 'Engelbert Humperdinck', 'Edit'],
        [
          moment(startDates[6]).add(get10BusinessDays(startDates[6]), 'days').format('DD/MM/yyyy'),
          'Awaiting, UncategorisedB0037AA',
          '14',
          'Awaiting approval',
          'Engelbert Humperdinck',
          'PNOMIS',
        ],
        [
          moment(startDates[7]).add(get10BusinessDays(startDates[7]), 'days').format('DD/MM/yyyy'),
          'Approved, UncategorisedB0038AA',
          '5',
          'Approved',
          'Engelbert Humperdinck',
          'PNOMIS',
        ],
      ])
    })
  })
  describe('side filters', () => {
    beforeEach(() => {
      cy.task('stubUncategorised')
      cy.task('stubGetPrisonerSearchPrisoners')
      cy.task('stubSentenceData', {
        offenderNumbers: [],
        bookingIds: [],
        startDates: [],
      })

      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()
    })
    it('should hide the filter when hide filter button is pressed and keep hidden until show filter is pressed', () => {
      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.filterContainer().should('be.visible')
      categoriserHomePage.hideFilterButton().should('contain', 'Hide filter')
      categoriserHomePage.hideFilterButton().click()
      cy.contains('Filters').should('not.exist')
      cy.reload()
      cy.contains('Filters').should('not.exist')
      categoriserHomePage.hideFilterButton().should('contain', 'Show filter')
      categoriserHomePage.hideFilterButton().click()
      categoriserHomePage.filterContainer().should('be.visible')
      cy.reload()
      categoriserHomePage.filterContainer().should('be.visible')
      categoriserHomePage.hideFilterButton().should('contain', 'Hide filter')
    })
    it('should apply the filters that are selected', () => {
      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.overdueCheckbox().should('not.be.checked')
      categoriserHomePage.overdueCheckbox().click()
      categoriserHomePage.applyFiltersButton().click()
      categoriserHomePage.overdueCheckbox().should('be.checked')
      cy.contains('You have 1 filter applied')
    })
    it('should show correct message when no results and filters are applied', () => {
      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.overdueCheckbox().click()
      categoriserHomePage.applyFiltersButton().click()
      categoriserHomePage.noResultsDueToFiltersDiv().should('be.visible')
    })
  })
})
