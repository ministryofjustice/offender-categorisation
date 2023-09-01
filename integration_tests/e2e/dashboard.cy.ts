import STATUS from '../../server/utils/statusEnum'
import { CATEGORISER_USER, RECATEGORISER_USER, SUPERVISOR_USER } from '../factory/user'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import { AGENCY_LOCATION } from '../factory/agencyLocation'
import Page from '../pages/page'
import DashboardInitialPage from '../pages/dashboard/initial'
import DashboardRecategorisationPage from '../pages/dashboard/recat'
import setupRecatStats from '../fixtures/dashboard/recategorisation-statistics'
import setupChangeTable from '../fixtures/dashboard/change-table'
import setupTprsStats from '../fixtures/dashboard/tprs-statistics'

describe('Dashboard', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
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

  const allMalePrisonEstateScope = 'all male prisons'

  describe('Initial Categorisation dashboard', () => {
    let dashboardInitialPage: DashboardInitialPage

    const baseOffenderData = (bookingId: number) => ({
      id: -bookingId,
      bookingId,
      offenderNo: `B00${bookingId}XY`,
      assignedUserId: CATEGORISER_USER.username,
      nomisSequenceNumber: 1,
      catType: CATEGORISATION_TYPE.INITIAL,
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      riskProfile: {},
      startDate: new Date('2019-07-01Z00:00'),
      assessmentDate: new Date('2019-07-22'),
      approvedBy: SUPERVISOR_USER.username,
      approvalDate: new Date('2019-07-29'),
      dueByDate: new Date('2019-08-03'),
    })

    beforeEach(() => {
      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(10),
        status: STATUS.AWAITING_APPROVAL.name,
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: null } },
        },
        approvedBy: null,
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(11),
        assignedUserId: RECATEGORISER_USER.username,
        catType: CATEGORISATION_TYPE.RECAT,
        status: STATUS.AWAITING_APPROVAL.name,
        formResponse: { recat: { decision: { category: 'B' }, securityInput: null }, supervisor: { review: null } },
        approvedBy: null,
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(30),
        assignedUserId: RECATEGORISER_USER.username,
        catType: CATEGORISATION_TYPE.RECAT,
        formResponse: { recat: { decision: { category: 'C' }, securityInput: null }, supervisor: { review: null } },
        riskProfile: {},
        approvalDate: new Date('2019-08-05'),
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(20),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: null } },
        },
        approvalDate: new Date('2019-08-01'),
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(21),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: 'B' } },
        },
        assessmentDate: new Date('2019-07-21'),
        approvalDate: new Date('2019-07-31'),
        dueByDate: new Date('2019-08-02'),
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(22),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: null } },
        },
        startDate: new Date('2019-07-01T03:00Z'),
        referredDate: new Date('2019-07-09T15:30Z'),
        securityReviewedDate: new Date('2019-07-09T17:40Z'),
        assessmentDate: new Date('2019-07-22'),
        approvalDate: new Date('2019-07-30'),
        dueByDate: new Date('2019-08-03'),
        riskProfile: { socProfile: { transferToSecurity: 'true' } },
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(23),
        formResponse: {
          ratings: { securityInput: { securityInputNeeded: 'Yes' } },
          supervisor: { review: { supervisorOverriddenCategory: 'D' } },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: 'B' } },
        },
        startDate: new Date('2019-07-01T04:00Z'),
        referredDate: new Date('2019-07-10T09:00Z'),
        securityReviewedDate: new Date('2019-07-11T11:00Z'),
        assessmentDate: new Date('2019-07-23'),
        approvalDate: new Date('2019-07-29'),
        dueByDate: new Date('2019-07-28'),
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(34),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: { supervisorOverriddenCategory: 'R' } },
          categoriser: { provisionalCategory: { suggestedCategory: 'R', overriddenCategory: 'T' } },
        },
        prisonId: AGENCY_LOCATION.LNI.id,
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(24),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: { supervisorOverriddenCategory: 'C' } },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: 'B' } },
        },
        prisonId: AGENCY_LOCATION.BXI.id,
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(25),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: 'B' } },
        },
        prisonId: AGENCY_LOCATION.BXI.id,
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(26),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: null } },
        },
        prisonId: AGENCY_LOCATION.BXI.id,
        riskProfile: { socProfile: { transferToSecurity: 'true' } },
        referredDate: new Date('2019-07-20T00:00Z'),
        securityReviewedDate: new Date('2019-07-29T00:00Z'),
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(27),
        formResponse: {
          ratings: { securityInput: { securityInputNeeded: 'Yes' } },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'I', overriddenCategory: null } },
        },
        prisonId: AGENCY_LOCATION.BXI.id,
        referredDate: new Date('2019-07-20T00:00Z'),
        securityReviewedDate: new Date('2019-07-29T00:00Z'),
      })

      cy.task('insertFormTableDbRow', {
        ...baseOffenderData(28),
        formResponse: {
          ratings: { securityInput: null },
          supervisor: { review: null },
          categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: null } },
        },
        prisonId: AGENCY_LOCATION.BXI.id,
        riskProfile: { socProfile: { transferToSecurity: 'true' } },
        referredDate: new Date('2019-07-20T00:00Z'),
        securityReviewedDate: new Date('2019-07-29T00:00Z'),
      })

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
      setupRecatStats()

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
      setupRecatStats()

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
        setupChangeTable()
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
        dashboardRecategorisationPage.dateToInput().type('14/08/2019')
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
        dashboardRecategorisationPage.dateFromInput().type('16/08/2017')
        dashboardRecategorisationPage.dateToInput().type('14/08/2019')
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
        dashboardRecategorisationPage.dateFromInput().type('15/08/2016')
        dashboardRecategorisationPage.dateToInput().type('15/08/2016')
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
        setupTprsStats()
        cy.visit(DashboardRecategorisationPage.baseUrl)
        dashboardRecategorisationPage = Page.verifyOnPage(DashboardRecategorisationPage)
      })

      it('should display the correct statistics', () => {
        dashboardRecategorisationPage.validateTprsTableData([['Total recategorisations through TPRS', '1']])
      })
    })
  })
})
