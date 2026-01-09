import moment from 'moment/moment'
import { RECATEGORISER_USER } from '../../factory/user'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'
import STATUS from '../../../server/utils/statusEnum'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'

import RecategoriserLandingPage from '../../pages/recategoriser/landingPage'
import Page from '../../pages/page'

// check if stubbing recategorise works here
// clean up womens apostrophes

describe('Recategoriser Landing page', () => {
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

    cy.task('stubAssessments', { offenderNumber: 'B2345XY', emptyResponse: false, bookingId: 12 })

    cy.task('stubAgencyDetails', { agency: 'LPI' })
  })

  it('A recategoriser user can start a recat from the landing page', () => {
    cy.task('stubRecategorise')
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
    })

    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

    landingPage.recatButton().should('be.visible')
    landingPage.nextReviewDateButton().should('be.visible')

    cy.task('stubUpdateNextReviewDate', {
      date: moment(today).add(10, 'days').format('YYYY-MM-DD'),
    })

    landingPage.recatButton().click()
    Page.verifyOnPage(TasklistRecatPage)
  })

  it('A recategoriser user sees a warning for initial cat', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'U',
      categoryCode: 'U',
    })

    cy.task('stubAssessments', { offenderNumber: 'B2345XY', emptyResponse: true })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

    landingPage.warning().should('be.visible')
    landingPage.warning().should('contain.text', 'This prisoner seems to need an INITIAL category')
    landingPage.recatButton().should('not.exist')
  })

  it('A recategoriser user can proceed with a cat when prisoner is cat U but has previous cats', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'U',
      categoryCode: 'U',
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

    landingPage.recatButton().should('be.visible')
    landingPage.nextReviewDateButton().should('be.visible')
  })

  it('A recategoriser user sees a warning for cat A', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'A',
      categoryCode: 'A',
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

    landingPage.recatButton().should('not.exist')
    landingPage
      .warning()
      .should(
        'contain.text',
        "You cannot start a category review early for a Cat A prisoner. You'll need to change their security category.",
      )
  })

  it('A recategoriser user sees a continue button when a recat is in progress', () => {
    cy.task('stubRecategorise')

    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345XY',
      sequenceNumber: 1,
      status: STATUS.STARTED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: today,
      formResponse: {},
      assignedUserId: RECATEGORISER_USER.username,
    })

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'C',
      categoryCode: 'C',
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)
  })

  it('A recategoriser user sees a warning for initial cat being in progress', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      catType: CATEGORISATION_TYPE.INITIAL,
      offenderNo: 'B2345XY',
      sequenceNumber: 1,
      status: STATUS.STARTED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: today,
      formResponse: {},
      assignedUserId: RECATEGORISER_USER.username,
    })

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'C',
      categoryCode: 'C',
    })

    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

    landingPage.recatButton().should('not.exist')
    landingPage.editButton().should('not.exist')
    landingPage.warning().should('be.visible')
    landingPage.warning().should('contain.text', 'This prisoner has an initial categorisation in progress')
  })

  it('A recategoriser user sees a warning for awaiting approval', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345XY',
      sequenceNumber: 1,
      status: STATUS.AWAITING_APPROVAL.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: today,
      formResponse: {},
      assignedUserId: RECATEGORISER_USER.username,
    })

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'C',
      categoryCode: 'C',
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

    landingPage.recatButton().should('not.exist')
    landingPage.warning().should('be.visible')
    landingPage.warning().should('contain.text', 'This prisoner is awaiting supervisor approval')
    landingPage.viewButton().should('be.visible')
  })

  it('A recategoriser user sees no next review button if there are no existing cats', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345XY',
      youngOffender: false,
      indeterminateSentence: false,
      category: 'C',
      categoryCode: 'C',
      nextReviewDate: null,
    })
    cy.task('stubAssessments', {
      offenderNumber: 'B2345XY',
      emptyResponse: true,
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

    landingPage.nextReviewDateButton().should('not.exist')
  })

  describe('Women"s estate', () => {
    it('A recategoriser user can proceed with a cat when prisoner is Women"s Open category (T)', () => {
      cy.task('stubGetOffenderDetails', {
        bookingId: 12,
        offenderNo: 'B2345XY',
        youngOffender: false,
        indeterminateSentence: false,
        category: 'T',
        categoryCode: 'T',
      })

      cy.stubLogin({ user: RECATEGORISER_USER })
      cy.signIn()

      cy.visit('/12')

      const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

      landingPage.recatButton().should('be.visible')
      landingPage.warning().should('not.exist')
    })

    it('A recategoriser user can proceed with a cat when prisoner is Women"s Closed category (R)', () => {
      cy.task('stubGetOffenderDetails', {
        bookingId: 12,
        offenderNo: 'B2345XY',
        youngOffender: false,
        indeterminateSentence: false,
        category: 'R',
        categoryCode: 'R',
      })

      cy.stubLogin({ user: RECATEGORISER_USER })
      cy.signIn()

      cy.visit('/12')

      const landingPage = Page.verifyOnPage(RecategoriserLandingPage)

      landingPage.recatButton().should('be.visible')
      landingPage.warning().should('not.exist')
    })
  })
})
