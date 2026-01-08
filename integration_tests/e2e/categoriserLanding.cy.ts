import { CATEGORISER_USER } from '../factory/user'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import { AGENCY_LOCATION } from '../factory/agencyLocation'
import STATUS from '../../server/utils/statusEnum'

import TaskListPage from '../pages/taskList/taskList'
import CategoriserLandingPage from '../pages/categoriser/landingPage'
import Page from '../pages/page'

describe('Categoriser Landing page', () => {
  let today: Date

  beforeEach(() => {
    today = new Date()

    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [12],
      startDates: [today],
    })

    cy.task('stubGetOcgmAlert', {
      offenderNo: 'B2345XY',
      transferToSecurity: false,
    })

    cy.task('stubAssessments', { offenderNumber: 'B2345XY', emptyResponse: true, bookingId: 12 })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
    cy.task('stubUncategorised')
  })

  it('A categoriser user can start an initial cat from the landing page', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      nextReviewDate: null,
      category: 'U',
      categoryCode: 'U',
    })

    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(CategoriserLandingPage)

    landingPage.initialButton().should('be.visible')
    landingPage.initialButton().invoke('attr', 'href').should('contain', '/tasklist/12?reason=MANUAL')
    landingPage.warning().should('not.exist')
    landingPage.nextReviewDateButton().should('not.exist')

    landingPage.initialButton().click()
    Page.verifyOnPage(TaskListPage)

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, data => {
      const dbRecord = data.rows[0]

      expect(dbRecord.assigned_user_id).to.equal('CATEGORISER_USER')
      expect(dbRecord.approved_by).to.be.null
      expect(dbRecord.status).to.equal('STARTED')
      expect(dbRecord.cat_type).to.equal('INITIAL')
      expect(dbRecord.review_reason).to.equal('MANUAL')

      return true
    })
  })

  it('A categoriser user can start an initial cat where a cat already exists', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'B',
      categoryCode: 'B',
      nextReviewDate: null,
    })

    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(CategoriserLandingPage)

    landingPage.initialButton().should('be.visible')
    landingPage.recatButton().should('not.exist')
    landingPage.warning().should('contain.text', 'This prisoner is already Cat B')

    landingPage.initialButton().click()
    Page.verifyOnPage(TaskListPage)

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, data => {
      const dbRecord = data.rows[0]

      expect(dbRecord.assigned_user_id).to.equal('CATEGORISER_USER')
      expect(dbRecord.status).to.equal('STARTED')
      expect(dbRecord.cat_type).to.equal('INITIAL')
      expect(dbRecord.review_reason).to.equal('MANUAL')
      expect(dbRecord.approved_by).to.be.null

      return true
    })
  })

  it('A categoriser user sees a continue button when an initial cat is in progress', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      offenderNo: 'B2345XY',
      sequenceNumber: 1,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.INITIAL,
      status: STATUS.STARTED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: today,
      formResponse: {},
      assignedUserId: 'CATEGORISER_USER',
      securityReviewedBy: null,
      securityReviewedDate: null,
      approvedBy: null,
    })

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'U',
      nextReviewDate: null,
    })

    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(CategoriserLandingPage)

    landingPage.initialButton().should('not.exist')
    landingPage.editButton().should('be.visible')
    landingPage.warning().should('not.exist')
    landingPage.editButton().click()

    Page.verifyOnPage(TaskListPage)
  })

  it('A categoriser use sees a warning when a recat is in progress', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      offenderNo: 'B2345XY',
      sequenceNumber: 1,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.RECAT,
      status: STATUS.STARTED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: today,
      formResponse: {},
      assignedUserId: 'RECATEGORISER_USER',
      securityReviewedBy: null,
      securityReviewedDate: null,
      approvedBy: null,
    })

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'U',
      nextReviewDate: null,
    })

    cy.stubLogin({ user: CATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(CategoriserLandingPage)

    landingPage.initialButton().should('not.exist')
    landingPage.editButton().should('not.exist')
    landingPage
      .warning()
      .should('be.visible')
      .and('contain.text', 'This prisoner has a categorisation review in progress')
  })

  it('A categoriser user sees a warning for awaiting approval', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      offenderNo: 'B2345XY',
      sequenceNumber: 1,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.INITIAL,
      status: STATUS.AWAITING_APPROVAL.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: today,
      formResponse: {},
      assignedUserId: 'CATEGORISER_USER',
      securityReviewedBy: null,
      securityReviewedDate: null,
      approvedBy: null,
    })

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'U',
      nextReviewDate: null,
    })

    cy.stubLogin({ user: CATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(CategoriserLandingPage)

    landingPage.initialButton().should('not.exist')

    landingPage.warning().should('be.visible').and('contain.text', 'This prisoner is awaiting supervisor approval')

    landingPage.viewButton().should('be.visible')
  })

  it('A categoriser user sees a next review button when a previous cat exists', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'U',
    })

    cy.stubLogin({ user: CATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(CategoriserLandingPage)

    landingPage.nextReviewDateButton().should('be.visible')
  })

  describe("Women's estate", () => {
    it("A categoriser user can proceed with a cat when prisoner is Women's Open category (T)", () => {
      cy.task('stubGetOffenderDetails', {
        bookingId: 12,
        offenderNo: 'B2345XY',
        youngOffender: false,
        indeterminateSentence: false,
        category: 'T',
      })

      cy.stubLogin({ user: CATEGORISER_USER })
      cy.signIn()

      cy.visit('/12')

      const landingPage = Page.verifyOnPage(CategoriserLandingPage)

      landingPage.initialButton().should('be.visible')
      landingPage.warning().should('be.visible').and('contain.text', 'This prisoner is already Cat T')
    })

    it("A categoriser user can proceed with a cat when prisoner is Women's Closed category (R)", () => {
      cy.task('stubGetOffenderDetails', {
        bookingId: 12,
        offenderNo: 'B2345XY',
        youngOffender: false,
        indeterminateSentence: false,
        category: 'R',
      })

      cy.stubLogin({ user: CATEGORISER_USER })
      cy.signIn()

      cy.visit('/12')

      const landingPage = Page.verifyOnPage(CategoriserLandingPage)

      landingPage.initialButton().should('be.visible')
      landingPage.warning().should('be.visible').and('contain.text', 'This prisoner is already Cat R')
    })
  })
})
