import { SUPERVISOR_USER } from '../factory/user'
import Page from '../pages/page'
import DashboardInitialPage from '../pages/dashboard/initial'
import DashboardRecategorisationPage from '../pages/dashboard/recat'
import { mensInitialCategorisationDashboardStatsSeedData } from '../fixtures/dashboard/mens/inital-cat'
import { mensRecatStatSeedData } from '../fixtures/dashboard/mens/recategorisation-statistics'
import { mensChangeTableSeedData } from '../fixtures/dashboard/mens/change-table'
import mensTprsStatsSeedData from '../fixtures/dashboard/mens/tprs-statistics'
import { dbSeeder } from '../fixtures/db-seeder'

describe('Dashboard', () => {
  const allMalePrisonEstateScope = 'all male prisons'

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  beforeEach(() => {
    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B0012XY'],
      bookingIds: [12],
      startDates: ['28/01/2019'],
    })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()
  })

  describe('Initial Categorisation dashboard', () => {
    let dashboardInitialPage: DashboardInitialPage

    beforeEach(() => {
      dbSeeder(mensInitialCategorisationDashboardStatsSeedData)

      cy.visit(DashboardInitialPage.baseUrl)
      dashboardInitialPage = Page.verifyOnPage(DashboardInitialPage)
    })

    it('should show the expected stats when no search criteria are provided', () => {
      dashboardInitialPage.prisonStatisticsSelectionBox().contains(allMalePrisonEstateScope)

      dashboardInitialPage.validateCategorisationDecisionsTableData([
        ['C', '', '', '50.0%', '2'],
        ['C', 'B', '', '25.0%', '1'],
        ['C', 'B', 'Open', '25.0%', '1'],
        ['Total', '', '', '', '4'],
      ])

      dashboardInitialPage.validateReferralsToSecurityTableData([
        ['Manual', '1'],
        ['Automatic', '1'],
        ['Flagged', '0'],
        ['Total', '2'],
      ])

      dashboardInitialPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '8.5 days'],
        ['Sent to security to security review complete', '0.5 days'],
        ['Security review complete to approval complete', '19.5 days'],
        ['Assessment started to approval complete', '29.5 days'],
      ])

      dashboardInitialPage.validateCompletionsTableData([
        ['Before due date', '75.0%', '3'],
        ['Late', '25.0%', '1'],
        ['Total', '', '4'],
      ])
    })

    it('should show the expected stats when the user selects the whole estate', () => {
      dashboardInitialPage.prisonStatisticsSelectionBox().select(allMalePrisonEstateScope)
      dashboardInitialPage.submitSearchButton().click()

      dashboardInitialPage.validateCategorisationDecisionsTableData([
        ['C', '', '', '44.4%', '4'],
        ['C', 'B', '', '22.2%', '2'],
        ['C', 'B', 'C', '11.1%', '1'],
        ['C', 'B', 'Open', '11.1%', '1'],
        ['YOI closed', '', '', '11.1%', '1'],
        ['Total', '', '', '', '9'],
      ])

      dashboardInitialPage.validateReferralsToSecurityTableData([
        ['Manual', '2'],
        ['Automatic', '3'],
        ['Flagged', '0'],
        ['Total', '5'],
      ])

      dashboardInitialPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '14.8 days'],
        ['Sent to security to security review complete', '5.6 days'],
        ['Security review complete to approval complete', '7.8 days'],
        ['Assessment started to approval complete', '28.67 days'],
      ])

      dashboardInitialPage.validateCompletionsTableData([
        ['Before due date', '88.9%', '8'],
        ['Late', '11.1%', '1'],
        ['Total', '', '9'],
      ])
    })
  })

  describe('Recategorisation dashboard', () => {
    let dashboardRecategorisationPage: DashboardRecategorisationPage

    it('should show the expected stats when no search criteria are provided', () => {
      dbSeeder(mensRecatStatSeedData)

      cy.visit(DashboardRecategorisationPage.baseUrl)
      dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)

      dashboardRecategorisationPage.prisonStatisticsSelectionBox().contains(allMalePrisonEstateScope)

      dashboardRecategorisationPage.validateRecategorisationDecisionsTableData([
        ['B', '', '20.0%', '1'],
        ['C', '', '40.0%', '2'],
        ['C', 'B', '40.0%', '2'],
        ['Total', '', '', '5'],
      ])

      dashboardRecategorisationPage.validateReferralsToSecurityTableData([
        ['Manual', '1'],
        ['Automatic', '1'],
        ['Flagged', '1'],
        ['Total', '3'],
      ])

      dashboardRecategorisationPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '9 days'],
        ['Sent to security to security review complete', '9 days'],
        ['Security review complete to approval complete', '12.33 days'],
        ['Assessment started to approval complete', '30.8 days'],
      ])

      dashboardRecategorisationPage.validateCompletionsTableData([
        ['Before due date', '60.0%', '3'],
        ['Late', '40.0%', '2'],
        ['Total', '', '5'],
      ])
    })

    it('should show the expected stats when the user selects the whole estate', () => {
      dbSeeder(mensRecatStatSeedData)

      cy.visit(DashboardRecategorisationPage.baseUrl)
      dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)

      dashboardRecategorisationPage.prisonStatisticsSelectionBox().select(allMalePrisonEstateScope)
      dashboardRecategorisationPage.submitSearchButton().click()

      dashboardRecategorisationPage.validateRecategorisationDecisionsTableData([
        ['B', '', '22.2%', '2'],
        ['C', '', '44.4%', '4'],
        ['C', 'B', '33.3%', '3'],
        ['Total', '', '', '9'],
      ])

      dashboardRecategorisationPage.validateReferralsToSecurityTableData([
        ['Manual', '2'],
        ['Automatic', '2'],
        ['Flagged', '1'],
        ['Total', '5'],
      ])

      dashboardRecategorisationPage.validateAverageDurationsTableData([
        ['Assessment started to sent to security', '7.2 days'],
        ['Sent to security to security review complete', '10.8 days'],
        ['Security review complete to approval complete', '12.8 days'],
        ['Assessment started to approval complete', '34.56 days'],
      ])

      dashboardRecategorisationPage.validateCompletionsTableData([
        ['Before due date', '44.4%', '4'],
        ['Late', '55.6%', '5'],
        ['Total', '', '9'],
      ])
    })

    describe('Recategorisation decisions', () => {
      beforeEach(() => {
        dbSeeder(mensChangeTableSeedData)
        cy.visit(DashboardRecategorisationPage.baseUrl)
        dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)
      })

      it('should show correct change table', () => {
        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['B', '1', '6', '2', '', '', '9'],
          ['C', '1', '4', '3', '', '', '8'],
          ['D', '1', '', '', '', '', '1'],
          ['YOI closed', '', '', '', '3', '2', '5'],
          ['YOI open', '', '', '', '', '', '0'],
          ['Total', '3', '10', '5', '3', '2', '23'],
        ])
      })

      it('should allow filtering to an end date', () => {
        dashboardRecategorisationPage.dateFromInput().clear()
        dashboardRecategorisationPage.dateToInput().type('14/8/2019')
        dashboardRecategorisationPage.submitSearchButton().click()

        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['B', '1', '', '2', '', '', '3'],
          ['C', '1', '', '', '', '', '1'],
          ['D', '1', '', '', '', '', '1'],
          ['YOI closed', '', '', '', '', '', '0'],
          ['YOI open', '', '', '', '', '', '0'],
          ['Total', '3', '0', '2', '0', '0', '5'],
        ])
      })

      it('should allow filtering from a start date to an end date', () => {
        dashboardRecategorisationPage.dateFromInput().type('16/8/2017')
        dashboardRecategorisationPage.dateToInput().type('14/8/2019')
        dashboardRecategorisationPage.submitSearchButton().click()

        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['B', '1', '', '', '', '', '1'],
          ['C', '1', '', '', '', '', '1'],
          ['D', '1', '', '', '', '', '1'],
          ['YOI closed', '', '', '', '', '', '0'],
          ['YOI open', '', '', '', '', '', '0'],
          ['Total', '3', '0', '0', '0', '0', '3'],
        ])
      })

      it('should filter a period when initial B was recategorised as D', () => {
        dashboardRecategorisationPage.dateFromInput().type('15/8/2016')
        dashboardRecategorisationPage.dateToInput().type('15/8/2016')
        dashboardRecategorisationPage.submitSearchButton().click()

        dashboardRecategorisationPage.validateReviewNumbersTableData([
          ['B', '', '', '1', '', '', '1'],
          ['C', '', '', '', '', '', '0'],
          ['D', '', '', '', '', '', '0'],
          ['YOI closed', '', '', '', '', '', '0'],
          ['YOI open', '', '', '', '', '', '0'],
          ['Total', '0', '0', '1', '0', '0', '1'],
        ])
      })
    })

    describe('TPRS details', () => {
      beforeEach(() => {
        dbSeeder(mensTprsStatsSeedData)
        cy.visit(DashboardRecategorisationPage.baseUrl)
        dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)
      })

      it('should display the correct statistics', () => {
        dashboardRecategorisationPage.validateTprsTableData([['Total recategorisations through TPRS', '1']])
      })
    })
  })
})
