import { WOMEN_SUPERVISOR_USER } from '../factory/user'
import Page from '../pages/page'
import DashboardInitialPage from '../pages/dashboard/initial'
import DashboardRecategorisationPage from '../pages/dashboard/recat'
import { womensInitialCategorisationDashboardStatsSeedData } from '../fixtures/dashboard/womens/initial-cat'
import { womensRecatStatSeedData } from '../fixtures/dashboard/womens/recategorisation-statistics'
import { womensChangeTableSeedData } from '../fixtures/dashboard/womens/change-table'
import { dbSeeder } from '../fixtures/db-seeder'
import { CASELOAD } from '../factory/caseload'

describe('Dashboard - Womens', () => {
  const allFemalePrisonEstateScope = 'all female prisons'

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  beforeEach(() => {
    cy.task('stubUncategorisedAwaitingApprovalWithLocation', CASELOAD.PFI.id)
    cy.task('stubSentenceData', {
      offenderNumbers: ['ON700'],
      bookingIds: [700],
      startDates: ['28/1/2019'],
    })

    cy.task('stubGetOffenderDetailsWomen', { bookingId: 700, category: 'ON700' })
    cy.task('stubAssessmentsWomen', { offenderNo: 'ON700' })
    cy.task('stubAgencyDetails', { agency: 'PFI' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'ON700', formattedReleaseDate: '2014-11-23' })

    cy.stubLogin({
      user: WOMEN_SUPERVISOR_USER,
    })
    cy.signIn()
  })

  describe('Initial Categorisation dashboard', () => {
    let dashboardInitialPage: DashboardInitialPage

    beforeEach(() => {
      dbSeeder(womensInitialCategorisationDashboardStatsSeedData)

      cy.visit(DashboardInitialPage.baseUrl)
      dashboardInitialPage = Page.verifyOnPage(DashboardInitialPage)
    })

    it('should show the expected stats when no search criteria are provided', () => {
      dashboardInitialPage.prisonStatisticsSelectionBox().contains(allFemalePrisonEstateScope)

      dashboardInitialPage.validateCategorisationDecisionsTableData([
        ['YOI closed', '', '25.0%', '2'],
        ['YOI closed', 'YOI open', '12.5%', '1'],
        ['YOI open', 'YOI closed', '12.5%', '1'],
        ['Closed', '', '25.0%', '2'],
        ['Closed', 'Open', '12.5%', '1'],
        ['Open', 'Open', '12.5%', '1'],
        ['Total', '', '', '8'],
      ])

      dashboardInitialPage.validateReferralsToSecurityTableData([
        ['Manual', '2'],
        ['Automatic', '2'],
        ['Flagged', '0'],
        ['Total', '4'],
      ])

      dashboardInitialPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '8.5 days'],
        ['Sent to security to security review complete', '0.5 days'],
        ['Security review complete to approval complete', '19.5 days'],
        ['Assessment started to approval complete', '29.5 days'],
      ])

      dashboardInitialPage.validateCompletionsTableData([
        ['Before due date', '75.0%', '6'],
        ['Late', '25.0%', '2'],
        ['Total', '', '8'],
      ])
    })

    it('should show the expected stats when the user selects the whole estate', () => {
      dashboardInitialPage.prisonStatisticsSelectionBox().select(allFemalePrisonEstateScope)
      dashboardInitialPage.submitSearchButton().click()

      dashboardInitialPage.validateCategorisationDecisionsTableData([
        ['YOI closed', '', '16.7%', '2'],
        ['YOI closed', 'YOI open', '8.3%', '1'],
        ['YOI open', 'YOI closed', '8.3%', '1'],
        ['Closed', '', '25.0%', '3'],
        ['Closed', 'Closed', '8.3%', '1'],
        ['Closed', 'Open', '16.7%', '2'],
        ['Open', '', '8.3%', '1'],
        ['Open', 'Open', '8.3%', '1'],
        ['Total', '', '', '12'],
      ])

      dashboardInitialPage.validateReferralsToSecurityTableData([
        ['Manual', '3'],
        ['Automatic', '3'],
        ['Flagged', '0'],
        ['Total', '6'],
      ])

      dashboardInitialPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '12 days'],
        ['Sent to security to security review complete', '3.33 days'],
        ['Security review complete to approval complete', '13 days'],
        ['Assessment started to approval complete', '29 days'],
      ])

      dashboardInitialPage.validateCompletionsTableData([
        ['Before due date', '83.3%', '10'],
        ['Late', '16.7%', '2'],
        ['Total', '', '12'],
      ])
    })
  })

  describe('Recategorisation dashboard', () => {
    let dashboardRecategorisationPage: DashboardRecategorisationPage

    it('should show the expected stats when no search criteria are provided', () => {
      dbSeeder(womensRecatStatSeedData)

      cy.visit(DashboardRecategorisationPage.baseUrl)
      dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)

      dashboardRecategorisationPage.prisonStatisticsSelectionBox().contains(allFemalePrisonEstateScope)

      dashboardRecategorisationPage.validateRecategorisationDecisionsTableData([
        ['YOI closed', '', '12.5%', '1'],
        ['YOI open', '', '12.5%', '1'],
        ['YOI open', 'YOI closed', '12.5%', '1'],
        ['Closed', '', '37.5%', '3'],
        ['Closed', 'Open', '12.5%', '1'],
        ['Open', 'Closed', '12.5%', '1'],
        ['Total', '', '', '8'],
      ])

      dashboardRecategorisationPage.validateReferralsToSecurityTableData([
        ['Manual', '2'],
        ['Automatic', '2'],
        ['Flagged', '2'],
        ['Total', '6'],
      ])

      dashboardRecategorisationPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '9 days'],
        ['Sent to security to security review complete', '9 days'],
        ['Security review complete to approval complete', '12.33 days'],
        ['Assessment started to approval complete', '30.63 days'],
      ])

      dashboardRecategorisationPage.validateCompletionsTableData([
        ['Before due date', '62.5%', '5'],
        ['Late', '37.5%', '3'],
        ['Total', '', '8'],
      ])
    })

    it('should show the expected stats when the user selects the whole estate', () => {
      dbSeeder(womensRecatStatSeedData)

      cy.visit(DashboardRecategorisationPage.baseUrl)
      dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)

      dashboardRecategorisationPage.prisonStatisticsSelectionBox().select(allFemalePrisonEstateScope)
      dashboardRecategorisationPage.submitSearchButton().click()

      dashboardRecategorisationPage.validateRecategorisationDecisionsTableData([
        ['YOI closed', '', '14.3%', '2'],
        ['YOI open', '', '14.3%', '2'],
        ['YOI open', 'YOI closed', '7.1%', '1'],
        ['Closed', '', '35.7%', '5'],
        ['Closed', 'Open', '7.1%', '1'],
        ['Open', '', '7.1%', '1'],
        ['Open', 'Closed', '14.3%', '2'],
        ['Total', '', '', '14'],
      ])

      dashboardRecategorisationPage.validateReferralsToSecurityTableData([
        ['Manual', '3'],
        ['Automatic', '3'],
        ['Flagged', '2'],
        ['Total', '8'],
      ])

      dashboardRecategorisationPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '7.88 days'],
        ['Sent to security to security review complete', '10.13 days'],
        ['Security review complete to approval complete', '12.63 days'],
        ['Assessment started to approval complete', '35.43 days'],
      ])

      dashboardRecategorisationPage.validateCompletionsTableData([
        ['Before due date', '42.9%', '6'],
        ['Late', '57.1%', '8'],
        ['Total', '', '14'],
      ])
    })

    describe('Recategorisation decisions', () => {
      beforeEach(() => {
        dbSeeder(womensChangeTableSeedData)
        cy.visit(DashboardRecategorisationPage.baseUrl)
        dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)
      })

      it('should show correct change table', () => {
        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['Open', '3', '2', '', '1', '6'],
          ['Closed', '8', '1', '', '', '9'],
          ['YOI closed', '', '', '1', '3', '4'],
          ['YOI open', '', '', '3', '1', '4'],
          ['Total', '11', '3', '4', '5', '23'],
        ])
      })

      it('should allow filtering to an end date', () => {
        dashboardRecategorisationPage.dateFromInput().clear()
        dashboardRecategorisationPage.dateToInput().type('14/8/2019')
        dashboardRecategorisationPage.submitSearchButton().click()

        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['Open', '', '1', '', '1', '2'],
          ['Closed', '2', '1', '', '', '3'],
          ['YOI closed', '', '', '', '', '0'],
          ['YOI open', '', '', '', '', '0'],
          ['Total', '2', '2', '0', '1', '5'],
        ])
      })

      it('should allow filtering from a start date to an end date', () => {
        dashboardRecategorisationPage.dateFromInput().type('16/8/2017')
        dashboardRecategorisationPage.dateToInput().type('14/8/2019')
        dashboardRecategorisationPage.submitSearchButton().click()

        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['Open', '', '1', '', '1', '2'],
          ['Closed', '', '1', '', '', '1'],
          ['YOI closed', '', '', '', '', '0'],
          ['YOI open', '', '', '', '', '0'],
          ['Total', '0', '2', '0', '1', '3'],
        ])
      })

      it('should filter a period when initial R was recategorised as T', () => {
        dashboardRecategorisationPage.dateFromInput().type('15/8/2016')
        dashboardRecategorisationPage.dateToInput().type('15/8/2016')
        dashboardRecategorisationPage.submitSearchButton().click()

        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['Open', '', '', '', '', '0'],
          ['Closed', '1', '', '', '', '1'],
          ['YOI closed', '', '', '', '', '0'],
          ['YOI open', '', '', '', '', '0'],
          ['Total', '1', '0', '0', '0', '1'],
        ])
      })
    })
  })
})
