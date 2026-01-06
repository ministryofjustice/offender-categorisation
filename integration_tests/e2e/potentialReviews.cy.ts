import { RECATEGORISER_USER } from '../factory/user'
import Page from '../pages/page'
import RecategoriserHomePage from '../pages/recategoriser/home'
import PotentialReviewsPage from '../pages/recategoriser/potentialReviewsPage'
import { AGENCY_LOCATION } from '../factory/agencyLocation'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import STATUS from '../../server/utils/statusEnum'
import moment from "moment/moment";

describe('Potential reviews', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')

    const today = new Date()

    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [today, today],
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
      id: 1,
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
    cy.task('stubGetOffenderDetailsByOffenderNoList', {
      bookingId: [11],
      offenderNumbers: ['B2345XY'],
    })
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.potentialReviewsTab().click()
    const potentialReviewsPage = Page.verifyOnPage(PotentialReviewsPage)
    potentialReviewsPage.validateCategoryReviewsTableData([
      ['31/01/2019', 'Clark, FrankB2345XY', moment().subtract(2, 'days').format('DD/MM/yyyy'), 'Check now'],
    ])
  })
})
