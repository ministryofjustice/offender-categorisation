import { SUPERVISOR_USER, RECATEGORISER_USER, CATEGORISER_USER } from '../../factory/user'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'
import STATUS from '../../../server/utils/statusEnum'

import Page from '../../pages/page'
import SupervisorLandingPage from '../../pages/supervisor/landing'

describe('Supervisor Landing page', () => {
  let today: Date
  const bookingId = 12
  const offenderNo = 'B2345XY'

  beforeEach(() => {
    today = new Date()

    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    cy.task('stubRecategorise')
    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubAssessments', { offenderNumber: offenderNo, emptyResponse: true })

    cy.task('stubSentenceData', {
      offenderNumbers: [offenderNo],
      bookingIds: [12],
      startDates: [today],
    })

    cy.task('stubGetOffenderDetails', {
      bookingId,
      offenderNo,
      youngOffender: false,
      indeterminateSentence: false,
      category: 'C',
      categoryCode: 'C',
      nextReviewDate: '2020-01-16',
    })
  })

  it('A supervisor user sees a prisoner with no cat data', () => {
    cy.task('stubGetOffenderDetails', {
      bookingId,
      offenderNo,
      youngOffender: false,
      indeterminateSentence: false,
      category: 'U',
      categoryCode: 'U',
      nextReviewDate: null,
    })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(SupervisorLandingPage)

    landingPage.nextReviewDateButton().should('not.exist')
    landingPage.paragraphs().should('not.contain.text', 'This prisoner has a categorisation review in progress')
  })

  it('A supervisor user sees a prisoner awaiting approval', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo,
      sequenceNumber: 1,
      status: STATUS.AWAITING_APPROVAL.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: today,
      formResponse: {},
      assignedUserId: RECATEGORISER_USER.username,
    })

    cy.stubLogin({ user: SUPERVISOR_USER })
    cy.signIn()

    cy.visit('/12')

    const landingPage = Page.verifyOnPage(SupervisorLandingPage)

    landingPage.approveButton().should('be.visible')
  })

  it('A supervisor user sees a started initial cat', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId,
      offenderNo,
      sequenceNumber: 1,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.INITIAL,
      status: STATUS.STARTED.name,
      prisonId: 'LEI',
      assignedUserId: CATEGORISER_USER.username,
      approvedBy: null,
      startDate: today,
      formResponse: {},
    })

    cy.task('stubUncategorisedAwaitingApproval')

    cy.stubLogin({ user: SUPERVISOR_USER })
    cy.signIn()

    cy.visit('/12')
    const landingPage = Page.verifyOnPage(SupervisorLandingPage)

    landingPage.paragraphs().should('contain.text', "This prisoner's initial categorisation is in progress.")
  })

  it('A supervisor user sees a started recat', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId,
      offenderNo,
      sequenceNumber: 1,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.RECAT,
      status: STATUS.STARTED.name,
      prisonId: 'LEI',
      assignedUserId: RECATEGORISER_USER.username,
      approvedBy: null,
      startDate: today,
      formResponse: {},
    })

    cy.stubLogin({ user: SUPERVISOR_USER })
    cy.signIn()

    cy.visit('/12')
    const landingPage = Page.verifyOnPage(SupervisorLandingPage)

    landingPage.paragraphs().should('contain.text', 'This prisoner has a categorisation review in progress.')
  })

  it('A supervisor user sees a prisoner with a cancelled cat', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId,
      offenderNo,
      sequenceNumber: 1,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.INITIAL,
      status: STATUS.CANCELLED.name,
      prisonId: 'LEI',
      assignedUserId: CATEGORISER_USER.username,
      approvedBy: null,
      startDate: today,
      formResponse: {},
    })

    cy.stubLogin({ user: SUPERVISOR_USER })
    cy.signIn()

    cy.visit('/12')
    const landingPage = Page.verifyOnPage(SupervisorLandingPage)

    landingPage.paragraphs().should('contain.text', 'They are due to be reviewed by:')
    landingPage.paragraphs().should('contain.text', 'Thursday 16 January 2020')
  })

  it('A supervisor user sees a next review button when there is an existing cat', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId,
      offenderNo,
      sequenceNumber: 1,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.INITIAL,
      status: STATUS.APPROVED.name,
      prisonId: 'LEI',
      approvedBy: SUPERVISOR_USER.username,
      startDate: today,
      formResponse: {},
    })

    cy.stubLogin({ user: SUPERVISOR_USER })
    cy.signIn()

    cy.visit('/12')
    const landingPage = Page.verifyOnPage(SupervisorLandingPage)

    landingPage.nextReviewDateButton().should('be.visible')
  })
})
