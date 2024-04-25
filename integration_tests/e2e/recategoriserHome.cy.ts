import moment from 'moment'
import { RECATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import STATUS from '../../server/utils/statusEnum'
import REVIEW_REASON from '../../server/utils/reviewReasonEnum'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import defaultRatingsFactory from '../factory/defaultRatings'
import Page from '../pages/page'
import RecategoriserHomePage from '../pages/recategoriser/home'
import { AGENCY_LOCATION } from '../factory/agencyLocation'
import { CASELOAD } from '../factory/caseload'

const commonOffenderData = {
  offenderNo: 'dummy',
  sequenceNumber: 1,
  status: STATUS.STARTED.name,
  prisonId: AGENCY_LOCATION.LEI.id,
  formResponse: defaultRatingsFactory('C'),
  userId: 'RECATEGORISER_USER',
  assignedUserId: 'RECATEGORISER_USER',
  reviewReason: REVIEW_REASON.DUE.name,
  referredDate: moment().subtract(1, 'month').format('yyyy-MM-DD'),
}

describe('Recategoriser Home page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  it('should be inaccessible to users without RECATEGORISER_USER', () => {
    cy.stubLogin({
      user: SECURITY_USER,
    })
    cy.signIn()
    cy.request({
      url: RecategoriserHomePage.baseUrl,
      failOnStatusCode: false,
    }).then(resp => {
      expect(resp.status).to.eq(403)
    })
  })

  describe('when the user has the required role', () => {
    beforeEach(() => {
      cy.task('stubCategorisedMultiple')

      cy.task('stubGetMyCaseloads', { caseloads: [CASELOAD.LEI] })
      cy.task('stubGetStaffDetailsByUsernameList', {
        usernames: [RECATEGORISER_USER.username, SUPERVISOR_USER.username],
      })
    })

    it('should show the no results message by default', () => {
      cy.task('stubRecategorise', { recategorisations: [], latestOnly: [] })
      cy.task('stubGetPrisonerSearchPrisoners')

      cy.stubLogin({
        user: RECATEGORISER_USER,
      })
      cy.signIn()

      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.noResultsDiv().should('be.visible')
    })

    it('should show upcoming recategorisations', () => {
      const recat = {
        offenderNo: 'G6707GT',
        bookingId: 99,
        firstName: 'DUFEATHOPHE',
        lastName: 'BETHID',
        assessmentDate: '2024-04-22',
        assessmentSeq: 18,
        assessStatus: 'P',
        category: 'C',
        nextReviewDate: '2025-01-01',
      }

      const sentenceStartDates = {
        [recat.offenderNo]: new Date('2019-01-28'),
      }

      cy.task('stubSentenceData', {
        offenderNumbers: [recat.offenderNo],
        bookingIds: [recat.bookingId],
        startDates: [sentenceStartDates.G6707GT],
      })

      cy.task('stubRecategorise', { recategorisations: [recat], latestOnly: [] })

      const dueByDate = moment().add(2, 'days')
      cy.task('insertFormTableDbRow', {
        ...commonOffenderData,
        id: -100,
        bookingId: recat.bookingId,
        nomisSequenceNumber: 8,
        catType: CATEGORISATION_TYPE.RECAT,
        dueByDate: dueByDate.format('yyyy-MM-DD'),
        status: STATUS.AWAITING_APPROVAL.name,
        securityReviewedBy: 'FAKE_SECURITY_PERSON',
        startDate: moment().subtract(4, 'days').format('yyyy-MM-DD'),
        securityReviewedDate: moment().subtract(2, 'days').format('yyyy-MM-DD'),
        assessmentDate: new Date(),
        assessedBy: 'RECATEGORISER_USER',
      })

      cy.task('stubGetPrisonerSearchPrisoners', {
        agencyId: 'LEI',
        content: [recat],
      })

      cy.stubLogin({
        user: RECATEGORISER_USER,
      })
      cy.signIn()

      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.validateCategoryReviewsTableData([
        [
          dueByDate.format('DD/MM/yyyy'),
          'Bethid, Dufeathophe',
          recat.offenderNo,
          'Review due',
          'Awaiting approval',
          '',
          'View',
        ],
      ])
    })
  })
})
