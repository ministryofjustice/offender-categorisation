import { READONLY_USER } from '../factory/user'

import Page from '../pages/page'
import CategoriserLandingPage from '../pages/categoriser/landingPage'
import CategoryHistoryPage from '../pages/categoryHistory'

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
      id: -2,
      bookingId,
      offenderNo,
      sequenceNumber: 2,
      nomisSequenceNumber: 5,
      catType: 'INITIAL',
      status: 'APPROVED',
      prisonId: 'LEI',
      assignedUserId: 'CATEGORISER_USER',
      approvedBy: 'CATEGORISER_USER',
      startDate: today,
      formResponse: {},
    })

    cy.task('insertFormTableDbRow', {
      id: -3,
      bookingId,
      offenderNo,
      sequenceNumber: 3,
      nomisSequenceNumber: 4,
      catType: 'RECAT',
      status: 'APPROVED',
      prisonId: 'BXI',
      assignedUserId: 'RECATEGORISER_USER',
      approvedBy: 'RECATEGORISER_USER',
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
    historyPage.rows().should('have.length.at.least', 3)

    historyPage
      .rows()
      .eq(0)
      .within(() => {
        cy.get('td').eq(0).should('contain.text', '18/06/2019')
        cy.get('td').eq(1).should('contain.text', 'Unsentenced')
        cy.get('td').eq(2).should('contain.text', 'LPI prison')
        cy.get('td')
          .eq(3)
          .find('a')
          .should('have.attr', 'href')
          .and('contain', `/form/approvedView/${bookingId}?sequenceNo=3`)
      })

    historyPage
      .rows()
      .eq(2)
      .within(() => {
        cy.get('td').eq(1).should('contain.text', 'B')
        cy.get('td').eq(3).should('not.have.descendants', 'a')
      })

    cy.task('stubAssessments', { offenderNumber: offenderNo })
    cy.task('stubAgencyDetails', { agency: 'BXI' })
    cy.task('stubAgencyDetails', { agency: 'LEI' })

    historyPage.rows().eq(0).find('td > a').invoke('removeAttr', 'target').click()
    cy.url().should('contain', `/form/approvedView/${bookingId}?sequenceNo=3`)
  })
})
