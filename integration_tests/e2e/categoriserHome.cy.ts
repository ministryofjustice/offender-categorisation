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
        moment().subtract(19, 'days'),
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

      cy.task('stubGetOffenderDetailsBasic', {
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
          'Supervisor_back, Awaiting',
          'B0039AA',
          '1',
          'REJECTED BYSUPERVISOR',
          'Engelbert Humperdinck',
          'Edit',
        ],
        ['OVERDUE', 'Hillmob, Ant', 'B0040AA', '70', 'Started (Api User)', '', 'Edit'],
        ['OVERDUE', 'Missing, Awaiting', 'B0031AA', '55', 'Awaiting approval', 'Engelbert Humperdinck', 'PNOMIS'],
        ['OVERDUE', 'Started, Awaiting', 'B0032AA', '50', 'Started', 'Engelbert Humperdinck', 'PNOMIS'],
        ['OVERDUE', 'Awaiting, Awaiting', 'B0033AA', '47', 'Awaiting approval', 'Engelbert Humperdinck', 'View'],
        ['OVERDUE', 'Approved, Awaiting', 'B0034AA', '43', 'Approved', 'Engelbert Humperdinck', 'PNOMIS'],
        ['OVERDUE', 'Missing, Uncategorised', 'B0035AA', '39', 'Not categorised', 'Engelbert Humperdinck', 'Start'],
        ['OVERDUE', 'Started, Uncategorised', 'B0036AA', '19', 'Started', 'Engelbert Humperdinck', 'Edit'],
        [
          moment(startDates[6]).add(get10BusinessDays(startDates[6]), 'days').format('DD/MM/yyyy'),
          'Awaiting, Uncategorised',
          'B0037AA',
          '14',
          'Awaiting approval',
          'Engelbert Humperdinck',
          'PNOMIS',
        ],
        [
          moment(startDates[7]).add(get10BusinessDays(startDates[7]), 'days').format('DD/MM/yyyy'),
          'Approved, Uncategorised',
          'B0038AA',
          '5',
          'Approved',
          'Engelbert Humperdinck',
          'PNOMIS',
        ],
      ])
    })
  })
})
