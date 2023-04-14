import { SUPERVISOR_USER } from '../factory/user'
import ErrorPage from '../pages/error/error'

describe('Error pages', () => {
  beforeEach(() => {
    cy.task('stubUncategorisedAwaitingApproval')
  })

  it('should display a 500 error page when an API call errors', () => {
    cy.task('stubSentenceDataError')

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    new ErrorPage().checkErrorMessage({
      heading: 'Server Error',
      body: 'status 500',
    })
  })

  describe('The auth page is displayed when a user does not have the correct role for the url', () => {
    beforeEach(() => {
      const sentenceStartDates = {
        B2345XY: new Date('2019-01-28'),
        B2345YZ: new Date('2019-01-31'),
      }

      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY', 'B2345YZ'],
        bookingIds: [11, 12],
        startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
      })

      cy.stubLogin({
        user: SUPERVISOR_USER,
      })
      cy.signIn()
    })

    it('should display the 403 page when a user visits a page for which they do not have the required role', () => {
      cy.visit('/tasklist/12', {
        failOnStatusCode: false,
      })
      new ErrorPage().checkErrorMessage({
        heading: 'Unauthorised access: required role not present',
        body: 'status 403',
      })
    })

    it('should display the 403 page when a user visits a non-existent page', () => {
      cy.visit('/idontexist', {
        failOnStatusCode: false,
      })
      new ErrorPage().checkErrorMessage({
        heading: 'Url not recognised',
        body: 'status 403',
      })
    })
  })
})
