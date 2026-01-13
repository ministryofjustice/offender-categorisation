import { READONLY_USER } from '../factory/user'

import Page from '../pages/page'
import CategoriserLandingPage from '../pages/categoriser/landingPage'
import CategoryHistoryPage from '../pages/categoryHistory'
import ApprovedViewPage from '../pages/form/approvedView'

describe('Read-only user - category history', () => {
  const bookingId = 12
  const offenderNo = 'B2345YZ'
  let today: Date

  beforeEach(() => {
    today = new Date()

    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', offenderNo],
      bookingIds: [11, bookingId],
      startDates: [today, today],
    })

    cy.task('stubGetOcgmAlert', { offenderNo, transferToSecurity: false })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
    cy.task('stubAssessmentsWithCurrent', { offenderNo })

    cy.task('stubAgencyDetails', { agency: 'LEI' })
    cy.task('stubAgencyDetails', { agency: 'BXI' })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
  })

  it('A read-only user can view previous categorisations and next review date if prisoner is in their prison', () => {
    cy.task('insertFormTableDbRow', {
      id: -3,
      bookingId,
      offenderNo,
      sequenceNumber: 2,
      nomisSequenceNumber: 4,
      catType: 'RECAT',
      status: 'APPROVED',
      prisonId: 'BXI',
      assignedUserId: 'RECATEGORISER_USER',
      approvedBy: 'RECATEGORISER_USER',
      startDate: today,
      formResponse: {},
    })

    cy.task('insertFormTableDbRow', {
      id: -2,
      bookingId,
      offenderNo,
      sequenceNumber: 3,
      nomisSequenceNumber: 5,
      catType: 'INITIAL',
      status: 'APPROVED',
      prisonId: 'LEI',
      assignedUserId: 'CATEGORISER_USER',
      approvedBy: 'CATEGORISER_USER',
      startDate: today,
      formResponse: {},
    })

    cy.task('updateNomisSequenceNumber', {
      bookingId,
      sequenceNo: 1,
      nomisSequenceNo: 3,
    })

    cy.task('updateNomisSequenceNumber', {
      bookingId,
      sequenceNo: 2,
      nomisSequenceNo: 2,
    })

    cy.task('updateNomisSequenceNumber', {
      bookingId,
      sequenceNo: 3,
      nomisSequenceNo: 1,
    })

    cy.task('stubGetOffenderDetails', { bookingId, offenderNo })
    cy.task('stubGetOffenderDetails', { bookingId, basicInfo: true })

    cy.stubLogin({ user: READONLY_USER })
    cy.signIn()

    cy.visit(`/${bookingId}`)
    const landingPage = Page.verifyOnPage(CategoriserLandingPage)

    landingPage.nextReviewDate().should('be.visible')
    landingPage.nextReviewDate().should('have.text', 'They are due to be reviewed by Thursday 16 January 2020.')

    cy.task('stubAssessmentsWithCurrent', { offenderNo })
    cy.task('stubAgencyDetails', { agency: 'LEI' })
    cy.task('stubAgencyDetails', { agency: 'BXI' })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
    cy.task('stubGetCategoryHistory')

    landingPage.historyButton().click()

    const historyPage = Page.verifyOnPage(CategoryHistoryPage)

    historyPage.rows().should('have.length', 4)

    historyPage.assertRow(0, {
      date: '18/06/2019',
      category: 'Unsentenced',
      location: 'LPI prison',
      hasViewLink: true,
      hrefContains: '/form/approvedView/12?sequenceNo=3',
    })

    historyPage.assertRow(1, {
      date: '08/06/2018',
      category: 'P',
      location: 'LPI prison',
      hasViewLink: true,
      hrefContains: '/form/approvedView/12?sequenceNo=2',
    })

    historyPage.assertRow(2, {
      date: '24/03/2013',
      category: 'B',
      location: 'LPI prison',
      hasViewLink: false,
    })

    historyPage.assertRow(3, {
      date: '08/06/2012',
      category: 'A',
      location: 'LPI prison',
      hasViewLink: false,
    })

    historyPage.clickViewLink(0)

    Page.verifyOnPage(ApprovedViewPage)
  })
})
