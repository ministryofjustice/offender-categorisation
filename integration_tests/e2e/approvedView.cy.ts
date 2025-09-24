import { CATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import CategoriserHomePage from '../pages/categoriser/home'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import STATUS from '../../server/utils/statusEnum'
import SupervisorHomePage from '../pages/supervisor/home'
import SupervisorDonePage from '../pages/supervisor/done'
import Page from '../pages/page'
import ApprovedViewPage from '../pages/form/approvedView'
import moment from 'moment'
import { AGENCY_LOCATION } from '../factory/agencyLocation'

describe('Approved view', () => {
  let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>
  let formApprovedView: ApprovedViewPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  it('should be inaccessible to users without the role of CATEGORISER_USER', () => {
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

  const navigateToView = (
    { bookingId, sequenceNumber }: { bookingId?: number; sequenceNumber?: number } = {
      bookingId: 12,
      sequenceNumber: 1,
    },
  ) => {
    sentenceStartDates = {
      B2345XY: new Date('2019-01-28'),
      B2345YZ: new Date('2019-01-31'),
    }

    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
    })

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubCategorised', { bookingIds: [12] })
    cy.task('stubAgencyDetails', { agency: 'LEI' })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.doneTabLink().click()

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId, sequenceNumber }).click()

    formApprovedView = Page.verifyOnPage(ApprovedViewPage)
  }

  it('should correctly display the Suggested Category messaging', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      nomisSequenceNumber: 1,
      catType: CATEGORISATION_TYPE.INITIAL,
      offenderNo: 'dummy',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'C',
            categoryAppropriate: 'Yes',
            justification: 'test justification',
          },
        },
        supervisor: { review: { supervisorCategoryAppropriate: 'Yes' } },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
    }).then(() => {
      cy.wait(1000)
    })

    navigateToView()

    cy.validateCategorisationDetails([
      // column 1
      [
        { key: 'Name', value: 'Hillmob, Ant' },
        { key: 'NOMIS ID', value: 'B2345YZ' },
        { key: 'Date of birth', value: '17/02/1970' },
        { key: 'Current category', value: 'C' },
      ],
      // column 2
      [
        {
          key: 'Location',
          value: `C-04-02`,
        },
        {
          key: 'Location',
          value: `Coventry`,
        },
        {
          key: 'Nationality',
          value: `Latvian`,
        },
        {
          key: 'Main offence',
          value: `A Felony`,
        },
        {
          key: 'Main offence',
          value: `Another Felony`,
        },
      ],
      // column 3
      [
        { key: 'HDC Eligibility Date', value: '10/06/2020' },
        { key: 'Automatic Release Date', value: '11/06/2020' },
        { key: 'Conditional Release Date', value: '02/02/2020' },
        { key: 'Parole Eligibility Date', value: '13/06/2020' },
        { key: 'Non Parole Date', value: '14/06/2020' },
        { key: 'ISP Tariff End Date', value: '15/06/2020' },
        { key: 'Licence Expiry Date', value: '16/06/2020' },
        { key: 'Sentence Expiry Date', value: '17/06/2020' },
      ],
    ])

    // test court issued sentence table
    ;[
      {
        columnName: 'Line',
        expectedValues: ['2'],
      },
      {
        columnName: 'Start',
        expectedValues: ['31/12/2018'],
      },
      {
        columnName: 'Length of sentence',
        expectedValues: ['6 years, 3 months'],
      },
      {
        columnName: 'Consecutive to (line)',
        expectedValues: [''],
      },
      {
        columnName: 'Type',
        expectedValues: ['Std sentence'],
      },
    ].forEach(cy.checkTableColumnTextValues)

    formApprovedView.validateCategorisationWarnings([
      'Category C',
      'The categoriser recommends Category C',
      'The supervisor also recommends Category C',
    ])

    formApprovedView.validateCommentsVisibility({ areVisible: false })
    formApprovedView.validateOpenConditionsHeadingVisibility({ isVisible: false })

    formApprovedView.validateOtherInformationSummary([
      { question: 'Information about why this category is appropriate', expectedAnswer: 'test justification' },
    ])
  })

  it('should correctly display the "Cat overridden by categoriser and supervisor" messaging', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      userId: CATEGORISER_USER.username,
      bookingId: 12,
      nomisSequenceNumber: 1,
      catType: CATEGORISATION_TYPE.INITIAL,
      offenderNo: 'dummy',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'B',
            categoryAppropriate: 'No',
            overriddenCategory: 'C',
            justification: "Here are the categoriser's comments on why the category was changed",
          },
        },
        supervisor: {
          review: {
            supervisorCategoryAppropriate: 'No',
            supervisorOverriddenCategory: 'D',
            supervisorOverriddenCategoryText: "Here are the supervisor's comments on why the category was changed",
          },
        },
        openConditions: {
          riskLevels: { likelyToAbscond: 'No' },
          riskOfHarm: { seriousHarm: 'No' },
          foreignNational: { isForeignNational: 'No' },
          earliestReleaseDate: { fiveOrMoreYears: 'No' },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
    })

    navigateToView()

    formApprovedView.validateCategorisationWarnings([
      'Open category',
      'The recommended category was changed from Category B to Category C',
      'The recommended category was changed from Category C to open category',
    ])

    formApprovedView.validateSupervisorComments({
      expectedComments: `Here are the supervisor's comments on why the category was changed`,
    })
    formApprovedView.validateOtherInformationSummary([
      {
        question: 'Information about why this category is appropriate',
        expectedAnswer: "Here are the categoriser's comments on why the category was changed",
      },
    ])

    formApprovedView.validateOpenConditionsHeadingVisibility({ isVisible: true })

    formApprovedView.getBackToCaseListButton().click()

    Page.verifyOnPage(SupervisorDonePage)
  })

  it('should correctly display the historic other relevant information message', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      userId: CATEGORISER_USER.username,
      bookingId: 12,
      nomisSequenceNumber: 1,
      catType: CATEGORISATION_TYPE.INITIAL,
      offenderNo: 'dummy',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'B',
            categoryAppropriate: 'No',
            overriddenCategory: 'C',
            otherInformationText: "Here are the categoriser's comments on why the category was changed",
          },
        },
        supervisor: {
          review: {
            supervisorCategoryAppropriate: 'No',
            supervisorOverriddenCategory: 'D',
            supervisorOverriddenCategoryText: "Here are the supervisor's comments on why the category was changed",
          },
        },
        openConditions: {
          riskLevels: { likelyToAbscond: 'No' },
          riskOfHarm: { seriousHarm: 'No' },
          foreignNational: { isForeignNational: 'No' },
          earliestReleaseDate: { fiveOrMoreYears: 'No' },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
    })

    navigateToView()

    formApprovedView.validateOtherInformationSummary([
      {
        question: 'Other relevant information',
        expectedAnswer: "Here are the categoriser's comments on why the category was changed",
      },
    ])
  })

  it('should allow the display of a previous / older categorisation', () => {
    cy.task('stubAgencyDetails', { agency: 'BXI' })
    cy.task('stubAgencyDetails', { agency: 'LPI' })

    const threeMonthsAgo = moment().subtract(3, 'months')
    const threeMonthsAgoPlusOneDay = threeMonthsAgo.add(1, 'day')

    const commonPrisonerData = {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      status: STATUS.APPROVED.name,
      startDate: new Date(),
      securityReviewedBy: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
    }

    cy.task('insertFormTableDbRow', {
      ...commonPrisonerData,
      id: -1,
      nomisSequenceNumber: 1,
      catType: CATEGORISATION_TYPE.RECAT,
      sequenceNumber: 1,
      prisonId: AGENCY_LOCATION.BXI.id,
      formResponse: {
        recat: { decision: { category: 'B', categoryAppropriate: 'Yes' } },
      },
      securityReviewedDate: threeMonthsAgo,
    })

    cy.task('insertFormTableDbRow', {
      ...commonPrisonerData,
      id: -2,
      nomisSequenceNumber: 2,
      userId: CATEGORISER_USER.username,
      catType: CATEGORISATION_TYPE.INITIAL,
      sequenceNumber: 2,
      prisonId: AGENCY_LOCATION.LEI.id,
      formResponse: {
        categoriser: { provisionalCategory: { suggestedCategory: 'C', categoryAppropriate: 'Yes' } },
        supervisor: { review: { supervisorCategoryAppropriate: 'Yes' } },
      },
      securityReviewedDate: threeMonthsAgoPlusOneDay,
    })

    navigateToView({ bookingId: 12, sequenceNumber: 2 })

    formApprovedView.validateCategorisationWarnings([
      'Category C',
      'The categoriser recommends Category C',
      'The supervisor also recommends Category C',
    ])

    cy.visit(`/${ApprovedViewPage.baseUrl}/12?sequenceNo=1`)

    formApprovedView.validateCategorisationWarnings([
      'Category FFF',
      'The categoriser recommends Category B',
      'The supervisor also recommends Category B',
    ])
  })
})
