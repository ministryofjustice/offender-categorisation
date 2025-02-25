import { CATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import STATUS from '../../server/utils/statusEnum'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import defaultRatingsFactory from '../factory/defaultRatings'
import Page from '../pages/page'
import CategoriserHomePage from '../pages/categoriser/home'
import CategoriserDonePage from '../pages/categoriser/done'
import { AGENCY_LOCATION } from '../factory/agencyLocation'

const commonOffenderData = {
  offenderNo: 'dummy',
  sequenceNumber: 1,
  status: STATUS.APPROVED.name,
  prisonId: AGENCY_LOCATION.LEI.id,
  startDate: new Date(),
  formResponse: defaultRatingsFactory('C'),
  securityReviewedBy: null,
  securityReviewedDate: null,
  assignedUserId: 'CATEGORISER_USER',
}

describe('Categoriser Done page', () => {
  let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  it('should be inaccessible to users without CATEGORISER_USER', () => {
    cy.stubLogin({
      user: SECURITY_USER,
    })
    cy.signIn()
    cy.request({
      url: CategoriserHomePage.baseUrl,
      failOnStatusCode: false,
    }).then(resp => {
      expect(resp.status).to.eq(403)
    })
  })

  describe('when the user has the required role', () => {
    beforeEach(() => {
      cy.task('stubUncategorised')

      sentenceStartDates = {
        B2345XY: new Date('2019-01-28'),
        B2345YZ: new Date('2019-01-31'),
      }

      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY', 'B2345YZ'],
        bookingIds: [11, 12],
        startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
      })

      cy.task('stubGetStaffDetailsByUsernameList', { usernames: [CATEGORISER_USER.username, SUPERVISOR_USER.username] })
    })

    beforeEach(() => {
      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()
    })

    it('should show only approved initial cats', () => {
      cy.task('insertFormTableDbRow', {
        ...commonOffenderData,
        id: -1,
        bookingId: 12,
        nomisSequenceNumber: 8,
        catType: CATEGORISATION_TYPE.INITIAL,
      })

      cy.task('insertFormTableDbRow', {
        ...commonOffenderData,
        id: -2,
        bookingId: 11,
        nomisSequenceNumber: 7,
        catType: CATEGORISATION_TYPE.INITIAL,
      })

      cy.task('insertFormTableDbRow', {
        ...commonOffenderData,
        id: -3,
        bookingId: 10,
        catType: CATEGORISATION_TYPE.RECAT,
        assignedUserId: 'RECATEGORISER_USER',
      })

      cy.task('stubCategorisedMultiple', { bookingIds: [11, 12] })

      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.doneTabLink().click()
      ;[
        { columnName: 'Name and prison number', expectedValues: ['Scramble, TimB2345XY', 'Hemmel, SarahB2345YZ'] },
        {
          columnName: 'Approved on',
          expectedValues: ['20/04/2019', '28/02/2019'],
        },
        {
          columnName: 'Categorised by',
          expectedValues: ['Lamb, John', 'Fan, Jane'],
        },
        {
          columnName: 'Approved by',
          expectedValues: [
            'Lastname_supervisor_user, Firstname_supervisor_user',
            'Lastname_supervisor_user, Firstname_supervisor_user',
          ],
        },
        { columnName: 'Category', expectedValues: ['C', 'C'] },
      ].forEach(cy.checkTableColumnTextValues)
    })

    it("should not display offenders that haven't been categorised through the Categorisation tool", () => {
      cy.task('stubCategorised', { bookingIds: [] })

      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.doneTabLink().click()

      const categoriserDonePage = Page.verifyOnPage(CategoriserDonePage)
      categoriserDonePage.noResultsDiv().should('be.visible')
    })
  })
})
