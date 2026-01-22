import moment from 'moment/moment'
import { RECATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import PotentialReviewsPage from '../../pages/recategoriser/potentialReviewsPage'
import RiskProfileChangePage from '../../pages/recategoriser/riskProfileChangePage'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import STATUS from '../../../server/utils/statusEnum'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import { RiskChangeDbRow } from '../../db/queries'

describe('Potential reviews', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    const today = new Date()

    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [today, today],
    })
    cy.task('stubGetOffenderDetailsByOffenderNoList', {
      bookingId: [11],
      offenderNumbers: ['B2345XY'],
    })
    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()
  })

  it('The Potential reviews page is displayed correctly when no results', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.potentialReviewsTab().click()
    const potentialReviewsPage = Page.verifyOnPage(PotentialReviewsPage)
    potentialReviewsPage.todoTabLink()
    potentialReviewsPage.doneTabLink()
    cy.contains('No risk changes found.')
  })

  it('The Potential reviews page is displayed correctly when risk changes are present', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 11,
      formResponse: '{}',
      userId: 'RECATEGORISER_USER',
      status: STATUS.APPROVED.name,
      catType: CATEGORISATION_TYPE.INITIAL,
      assignedUserId: null,
      referredDate: null,
      referredBy: null,
      sequenceNumber: 1,
      riskProfile: null,
      prisonId: AGENCY_LOCATION.LEI.id,
      offenderNo: 'B2345XY',
      startDate: new Date(),
      securityReviewedBy: null,
      securityReviewedDate: null,
      approvalDate: '2019-01-20',
    })

    cy.task('insertRiskChangeTableDbRow', {
      offenderNumber: 'B2345XY',
      prisonId: AGENCY_LOCATION.LEI.id,
      status: 'NEW',
      oldRiskProfileJson: JSON.stringify({ socProfile: { transferToSecurity: true } }),
      newRiskProfileJson: JSON.stringify({ socProfile: { transferToSecurity: true } }),
      raisedDate: '2019-01-31',
    })
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.potentialReviewsTab().click()
    const potentialReviewsPage = Page.verifyOnPage(PotentialReviewsPage)
    potentialReviewsPage.validateCategoryReviewsTableData([
      ['31/01/2019', 'Clark, FrankB2345XY', moment().subtract(2, 'days').format('DD/MM/yyyy'), 'Check now'],
    ])
  })

  describe('Risk change alert detail', () => {
    beforeEach(() => {
      cy.task('stubGetOffenderDetails', {
        bookingId: 11,
        offenderNo: 'B2345XY',
        youngOffender: false,
        indeterminateSentence: false,
        nextReviewDate: null,
        category: 'U',
        categoryCode: 'U',
      })

      cy.task('stubGetEscapeProfile', {
        offenderNo: 'B2345XY',
        onEscapeList: false,
        activeOnEscapeList: true,
      })

      cy.task('stubGetOcgmAlert', {
        offenderNo: 'B2345XY',
        transferToSecurity: false,
      })

      cy.task('insertFormTableDbRow', {
        id: -1,
        bookingId: 11,
        formResponse: '{}',
        userId: 'RECATEGORISER_USER',
        status: STATUS.APPROVED.name,
        catType: CATEGORISATION_TYPE.INITIAL,
        assignedUserId: null,
        referredDate: null,
        referredBy: null,
        sequenceNumber: 1,
        riskProfile: null,
        prisonId: AGENCY_LOCATION.LEI.id,
        offenderNo: 'B2345XY',
        startDate: new Date(),
        securityReviewedBy: null,
        securityReviewedDate: null,
        approvalDate: '2019-01-20',
      })

      cy.task('insertRiskChangeTableDbRow', {
        offenderNumber: 'B2345XY',
        prisonId: AGENCY_LOCATION.LEI.id,
        status: 'NEW',
        oldRiskProfileJson: JSON.stringify({
          soc: { transferToSecurity: true },
          escape: {
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: false,
            escapeListAlerts: [],
            escapeRiskAlerts: [],
          },
          violence: {
            numberOfSeriousAssaults: 1,
            numberOfNonSeriousAssaults: 2,
            numberOfAssaults: 4,
            provisionalCategorisation: 'C',
          },
        }),
        newRiskProfileJson: JSON.stringify({
          soc: { transferToSecurity: true },
          escape: {
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: false,
            escapeListAlerts: [{ alertCode: 'XEL', dateCreated: '2016-09-14' }],
            escapeRiskAlerts: [],
          },
          violence: {
            numberOfSeriousAssaults: 1,
            numberOfNonSeriousAssaults: 2,
            numberOfAssaults: 4,
            provisionalCategorisation: 'C',
          },
        }),
        raisedDate: '2019-01-31',
      })
    })
    it('Displays the risk change alert correctly and allows processing', () => {
      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.potentialReviewsTab().click()

      const potentialReviewsPage = Page.verifyOnPage(PotentialReviewsPage)
      potentialReviewsPage.checkNowButton().click()

      const riskProfileChangePage = RiskProfileChangePage.createForBookingId(11)
      riskProfileChangePage.confirmationYes().click()
      riskProfileChangePage.submitButton().click()

      Page.verifyOnPage(TasklistRecatPage)
      cy.task('selectRiskChangeTableDbRow', { offenderNo: 'B2345XY' }).then((result: { rows: RiskChangeDbRow[] }) => {
        const row = result.rows[0]

        expect(row.status).to.eq('REVIEW_REQUIRED')
      })
    })

    it('The risk change alert can be ignored', () => {
      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.potentialReviewsTab().click()

      const potentialReviewsPage = Page.verifyOnPage(PotentialReviewsPage)
      potentialReviewsPage.checkNowButton().click()

      const riskProfileChangePage = RiskProfileChangePage.createForBookingId(11)
      riskProfileChangePage.confirmationNo().click()
      riskProfileChangePage.submitButton().click()

      Page.verifyOnPage(PotentialReviewsPage)
      cy.contains('No risk changes found.')
      cy.task('selectRiskChangeTableDbRow', { offenderNo: 'B2345XY' }).then((result: { rows: RiskChangeDbRow[] }) => {
        const row = result.rows[0]

        expect(row.status).to.eq('REVIEW_NOT_REQUIRED')
      })
    })
  })
})
