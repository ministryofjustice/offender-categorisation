import moment from 'moment'
import { RECATEGORISER_USER, RECATEGORISER_USER_PNI, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
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
    cy.task('deleteRowsFromForm')
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
      cy.task('stubGetMyCaseloads', { caseloads: [CASELOAD.PNI] })

      const recat = {
        offenderNo: 'G6707GT',
        bookingId: 99,
        firstName: 'DUFEATHOPHE',
        lastName: 'BETHID',
        assessmentDate: '2024-04-22',
        assessmentSeq: 18,
        assessStatus: 'P',
        category: 'C',
        nextReviewDate: moment().add(1, 'week').format('YYYY-MM-DD'),
      }

      const sentenceStartDates = {
        [recat.offenderNo]: new Date('2019-01-28'),
      }

      cy.task('stubSentenceData', {
        offenderNumbers: [recat.offenderNo],
        bookingIds: [recat.bookingId],
        startDates: [sentenceStartDates.G6707GT],
      })

      cy.task('stubRecategorise', { recategorisations: [recat], latestOnly: [], agencyId: 'PNI' })

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
        agencyId: 'PNI',
        content: [recat],
      })

      cy.stubLogin({
        user: RECATEGORISER_USER_PNI,
      })
      cy.signIn()

      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.validateCategoryReviewsTableData([
        [
          moment(recat.nextReviewDate).format('DD/MM/yyyy'),
          `Bethid, Dufeathophe${recat.offenderNo}`,
          'Review due',
          'Awaiting approval',
          'Engelbert Humperdinck',
          'View',
        ],
      ])
    })

    describe('side filters', () => {
      beforeEach(() => {
        cy.task('stubRecategorise', { recategorisations: [], latestOnly: [] })
        cy.task('stubGetPrisonerSearchPrisoners')

        cy.stubLogin({
          user: RECATEGORISER_USER,
        })
        cy.signIn()
      })
      it('should show the side filter by default', () => {
        const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
        recategoriserHomePage.filterContainer().should('be.visible')
      })
      it('should hide the filter when hide filter button is pressed and keep hidden until show filter is pressed', () => {
        const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
        recategoriserHomePage.filterContainer().should('be.visible')
        recategoriserHomePage.hideFilterButton().should('contain', 'Hide filter')
        recategoriserHomePage.hideFilterButton().click()
        cy.contains('Filters').should('not.exist')
        cy.reload()
        cy.contains('Filters').should('not.exist')
        recategoriserHomePage.hideFilterButton().should('contain', 'Show filter')
        recategoriserHomePage.hideFilterButton().click()
        recategoriserHomePage.filterContainer().should('be.visible')
        cy.reload()
        recategoriserHomePage.filterContainer().should('be.visible')
        recategoriserHomePage.hideFilterButton().should('contain', 'Hide filter')
      })
      it('should apply the filters that are selected', () => {
        const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
        recategoriserHomePage.lowRiskOfEscapeFilterCheckbox().should('not.be.checked')
        recategoriserHomePage.lowRiskOfEscapeFilterCheckbox().click()
        recategoriserHomePage.applyFiltersButton().click()
        recategoriserHomePage.lowRiskOfEscapeFilterCheckbox().should('be.checked')
        cy.contains('You have 1 filter applied')
      })
      it('should check all inputs when select all is clicked and update the button to deselect all', () => {
        const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
        recategoriserHomePage.selectAllFiltersButton().should('contain', 'Select all')
        recategoriserHomePage.selectAllFiltersButton().click()
        recategoriserHomePage.selectAllFiltersButton().should('contain', 'Deselect all')
        recategoriserHomePage.lowRiskOfEscapeFilterCheckbox().click()
        recategoriserHomePage.selectAllFiltersButton().should('contain', 'Select all')
      })
      it('should change select all to deselct all when all are selected manually', () => {
        const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
        recategoriserHomePage.selectAllFiltersButton().should('contain', 'Select all')
        cy.get('input[name="suitabilityForOpenConditions[]"]').each(input => {
          cy.wrap(input).click()
        })
        recategoriserHomePage.selectAllFiltersButton().should('contain', 'Deselect all')
      })
      it('should show deselect all initially when page is submitted with all filters selected', () => {
        cy.task('stubAdjudicationHearings', {
          agencyId: 'LEI',
          fromDate: moment().subtract(3, 'months').format('YYYY-MM-DD'),
          toDate: moment().subtract(2, 'months').format('YYYY-MM-DD'),
        })
        cy.task('stubAdjudicationHearings', {
          agencyId: 'LEI',
          fromDate: moment().subtract(2, 'months').format('YYYY-MM-DD'),
          toDate: moment().subtract(1, 'months').format('YYYY-MM-DD'),
        })
        cy.task('stubAdjudicationHearings', {
          agencyId: 'LEI',
          fromDate: moment().subtract(1, 'months').format('YYYY-MM-DD'),
          toDate: moment().format('YYYY-MM-DD'),
        })
        cy.task('stubMatchPrisoners')
        const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
        recategoriserHomePage.selectAllFiltersButton().should('contain', 'Select all')
        recategoriserHomePage.selectAllFiltersButton().click()
        recategoriserHomePage.applyFiltersButton().click()
        recategoriserHomePage.selectAllFiltersButton().should('contain', 'Deselect all')
      })
      it('should show correct message when no results and filters are applied', () => {
        const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
        recategoriserHomePage.lowRiskOfEscapeFilterCheckbox().click()
        recategoriserHomePage.applyFiltersButton().click()
        recategoriserHomePage.noResultsDueToFiltersDiv().should('be.visible')
      })
    })
  })
})
