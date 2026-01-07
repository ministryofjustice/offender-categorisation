import moment from 'moment'
import { CATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import Page from '../pages/page'
import CategoriserHomePage from '../pages/categoriser/home'
import { CASELOAD } from '../factory/caseload'
import dbSeeder from '../fixtures/db-seeder'
import initialCategorisation from '../fixtures/categoriser/home'
import { calculateOverdueText } from '../support/utilities'

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

    describe('when there are upcoming categorisations', () => {
      const offenderData = [
        { offenderNo: 'B0031AA', bookingId: 31, startDate: moment().subtract(55, 'days') },
        { offenderNo: 'B0032AA', bookingId: 32, startDate: moment().subtract(50, 'days') },
        { offenderNo: 'B0033AA', bookingId: 33, startDate: moment().subtract(47, 'days') },
        { offenderNo: 'B0034AA', bookingId: 34, startDate: moment().subtract(43, 'days') },
        { offenderNo: 'B0035AA', bookingId: 35, startDate: moment().subtract(39, 'days') },
        { offenderNo: 'B0036AA', bookingId: 36, startDate: moment().subtract(15, 'days') },
        { offenderNo: 'B0037AA', bookingId: 37, startDate: moment().subtract(14, 'days') },
        { offenderNo: 'B0038AA', bookingId: 38, startDate: moment().subtract(5, 'days') },
        { offenderNo: 'B0039AA', bookingId: 39, startDate: moment().subtract(1, 'days') },
        { offenderNo: 'B0040AA', bookingId: 40, startDate: moment().subtract(70, 'days') },
      ]

      const offenderNumbers = offenderData.map(o => o.offenderNo)
      const bookingIds = offenderData.map(o => o.bookingId)
      const startDates = offenderData.map(o => o.startDate)

      const reviewDatesDict: Record<string, string> = offenderData.reduce((acc, { offenderNo, startDate }) => {
        acc[offenderNo] = calculateOverdueText(startDate)
        return acc
      }, {})

      beforeEach(() => {
        dbSeeder(initialCategorisation)

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
      })

      it('should show upcoming categorisations including displaying Started and Edit for in progress categorisations', () => {
        const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
        categoriserHomePage.validateToDoTableData([
          [
            reviewDatesDict.B0039AA,
            'Supervisor_back, AwaitingB0039AA',
            '1',
            'REJECTED BYSUPERVISOR',
            'Engelbert Humperdinck',
            'Edit',
          ],
          [reviewDatesDict.B0040AA, 'Hillmob, AntB0040AA', '70', 'Started (Api User)', '', 'Edit'],
          [
            reviewDatesDict.B0031AA,
            'Missing, AwaitingB0031AA',
            '55',
            'Awaiting approval',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
          [
            reviewDatesDict.B0032AA,
            'Started, AwaitingB0032AA',
            '50',
            'Started (Api User)',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
          [
            reviewDatesDict.B0033AA,
            'Awaiting, AwaitingB0033AA',
            '47',
            'Awaiting approval',
            'Engelbert Humperdinck',
            'View',
          ],
          [reviewDatesDict.B0034AA, 'Approved, AwaitingB0034AA', '43', 'Approved', 'Engelbert Humperdinck', 'PNOMIS'],
          [
            reviewDatesDict.B0035AA,
            'Missing, UncategorisedB0035AA',
            '39',
            'Not categorised',
            'Engelbert Humperdinck',
            'Start',
          ],
          [
            reviewDatesDict.B0036AA,
            'Started, UncategorisedB0036AA',
            '15',
            'Started (Api User)',
            'Engelbert Humperdinck',
            'Edit',
          ],
          [
            reviewDatesDict.B0037AA,
            'Awaiting, UncategorisedB0037AA',
            '14',
            'Awaiting approval',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
          [
            reviewDatesDict.B0038AA,
            'Approved, UncategorisedB0038AA',
            '5',
            'Approved',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
        ])
      })

      it('should sort by due date when triggered', () => {
        const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
        cy.get('th button[data-index="0"]').click({ force: true })
        categoriserHomePage.validateToDoTableData([
          [reviewDatesDict.B0040AA, 'Hillmob, AntB0040AA', '70', 'Started (Api User)', '', 'Edit'],
          [
            reviewDatesDict.B0031AA,
            'Missing, AwaitingB0031AA',
            '55',
            'Awaiting approval',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
          [
            reviewDatesDict.B0032AA,
            'Started, AwaitingB0032AA',
            '50',
            'Started (Api User)',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
          [
            reviewDatesDict.B0033AA,
            'Awaiting, AwaitingB0033AA',
            '47',
            'Awaiting approval',
            'Engelbert Humperdinck',
            'View',
          ],
          [reviewDatesDict.B0034AA, 'Approved, AwaitingB0034AA', '43', 'Approved', 'Engelbert Humperdinck', 'PNOMIS'],
          [
            reviewDatesDict.B0035AA,
            'Missing, UncategorisedB0035AA',
            '39',
            'Not categorised',
            'Engelbert Humperdinck',
            'Start',
          ],
          [
            reviewDatesDict.B0036AA,
            'Started, UncategorisedB0036AA',
            '15',
            'Started (Api User)',
            'Engelbert Humperdinck',
            'Edit',
          ],
          [
            reviewDatesDict.B0037AA,
            'Awaiting, UncategorisedB0037AA',
            '14',
            'Awaiting approval',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
          [
            reviewDatesDict.B0038AA,
            'Approved, UncategorisedB0038AA',
            '5',
            'Approved',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
          [
            reviewDatesDict.B0039AA,
            'Supervisor_back, AwaitingB0039AA',
            '1',
            'REJECTED BYSUPERVISOR',
            'Engelbert Humperdinck',
            'Edit',
          ],
        ])
      })

      it('should maintain sort order when apply filters clicked', () => {
        const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
        cy.get('th button[data-index="0"]').click({ force: true })
        categoriserHomePage.applyFiltersButton().click()
        cy.get('th[aria-sort-attribute="date"]').invoke('attr', 'aria-sort').should('eq', 'ascending')
      })
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
