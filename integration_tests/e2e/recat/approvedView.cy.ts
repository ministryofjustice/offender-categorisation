import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'
import STATUS from '../../../server/utils/statusEnum'
import { RECATEGORISER_USER, SUPERVISOR_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecatApprovedViewPage from '../../pages/form/recatApprovedView'
import SupervisorHomePage from '../../pages/supervisor/home'
import SupervisorDonePage from '../../pages/supervisor/done'
import RecategoriserHomePage from '../../pages/recategoriser/home'

describe('Approved View', () => {
  let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>
  let recatApprovedViewPage: RecatApprovedViewPage
  let today: Date

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')

    sentenceStartDates = {
      B2345XY: new Date('2019-01-28'),
      B2345YZ: new Date('2019-01-31'),
    }

    today = new Date()
  })

  it('The approved view page is correctly displayed (suggested Cat)', () => {
    cy.task('insertFormTableDbRow', {
      id: -2,
      bookingId: 11,
      nomisSequenceNumber: 8,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C', justification: 'justification test' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
          supervisor: { review: { supervisorCategoryAppropriate: 'Yes' } },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: null,
      review_reason: 'AGE',
      approvalDate: '2025-03-06',
    })

    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      nomisSequenceNumber: 7,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C', justification: 'justification test' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
          supervisor: { review: { supervisorCategoryAppropriate: 'Yes' } },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: null,
      review_reason: 'AGE',
    })

    cy.task('updateRiskProfile', {
      bookingId: 12,
      riskProfile: {
        socProfile: { nomsId: 'B2345YZ', riskType: 'SOC', transferToSecurity: false },
        violenceProfile: {
          nomsId: 'B2345YZ',
          riskType: 'VIOLENCE',
          displayAssaults: true,
          numberOfAssaults: 5,
          notifySafetyCustodyLead: true,
          numberOfSeriousAssaults: 2,
          numberOfNonSeriousAssaults: 3,
          provisionalCategorisation: 'C',
          veryHighRiskViolentOffender: false,
        },
        extremismProfile: {
          nomsId: 'B2345YZ',
          riskType: 'EXTREMISM',
          notifyRegionalCTLead: true,
          increasedRiskOfExtremism: true,
          provisionalCategorisation: 'C',
        },
      },
    })

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubCategorised', {
      bookingIds: [12],
    })
    cy.task('stubAgencyDetails', { agency: 'LEI' })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.doneTabLink().click()

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.validateToDoTableData([
      ['B2345YZ', '06/03/2025', '', 'Lastname_supervisor_user, Firstname_supervisor_user', '', 'Recat', 'View'],
      [
        'Scramble, TimB2345XY',
        '21/02/2019',
        'Lamb, John',
        'Lastname_supervisor_user, Firstname_supervisor_user',
        'C',
        'Recat',
        'View',
      ],
    ])
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12 }).click()

    recatApprovedViewPage = Page.verifyOnPage(RecatApprovedViewPage)

    const approvedViewRecatPage = Page.verifyOnPage(RecatApprovedViewPage)
    approvedViewRecatPage.validateCategorisationWarnings([
      'Category C',
      'The categoriser recommends Category C',
      'The supervisor also recommends Category C',
    ])
    ;[
      {
        columnName: 'Categorisation date',
        expectedValues: ['24/03/2013', '08/06/2012'],
      },
      {
        columnName: 'Category decision',
        expectedValues: ['B', 'A'],
      },
      {
        columnName: 'Review location',
        expectedValues: ['LPI prison', 'LPI prison'],
      },
    ].forEach(cy.checkTableColumnTextValues)

    approvedViewRecatPage.validatePrisonerSummary(
      'This person has been reported as the perpetrator in 5 assaults in custody before, including 2 serious assaults and 3 non-serious assaults in the past 12 months. You should consider the dates and context of these assaults in your assessment.',
    )
    approvedViewRecatPage.validatePrisonerSummary('This person is at risk of engaging in, or vulnerable to, extremism.')

    approvedViewRecatPage.validateCategoryDecisionSummary([
      { question: 'What security category is most suitable for this person?', expectedAnswer: 'Category C' },
      { question: 'Information about why this category is appropriate', expectedAnswer: 'justification test' },
    ])
  })

  it('The approved view page is correctly displayed (Cat overridden by supervisor)', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 11,
      nomisSequenceNumber: 6,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 2,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C', justification: 'justification test' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
          supervisor: { review: { supervisorCategoryAppropriate: 'No' } },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
      review_reason: 'AGE',
    })

    cy.task('insertFormTableDbRow', {
      id: -2,
      bookingId: 12,
      nomisSequenceNumber: 7,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C', justification: 'justification test' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
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
      review_reason: 'AGE',
    })

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubCategorised', {
      bookingIds: [12],
    })
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

    cy.task('stubAgencyDetails', { agency: 'LPI' })

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12, sequenceNumber: 1 }).click()
    const approvedViewRecatPage = Page.verifyOnPage(RecatApprovedViewPage)
    approvedViewRecatPage.validateCategorisationWarnings([
      'Open category',
      'The categoriser recommends Category C',
      'The recommended category was changed from Category C to open category',
    ])

    approvedViewRecatPage.validateOpenConditionsHeadingVisibility({ isVisible: true })
    approvedViewRecatPage.validateCommentsVisibility({
      areVisible: true,
      comments: "Here are the supervisor's comments on why the category was changed",
    })
    approvedViewRecatPage.validateCategoryDecisionSummary([
      { question: 'What security category is most suitable for this person?', expectedAnswer: 'Category C' },
      { question: 'Information about why this category is appropriate', expectedAnswer: 'justification test' },
    ])
    approvedViewRecatPage.getBackToCaseListButton().click()
  })

  it('The approved view page is correctly displayed (recat role)', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      nomisSequenceNumber: 8,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C', justification: 'justification test' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
          supervisor: { review: { supervisorCategoryAppropriate: 'Yes' } },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
      review_reason: 'AGE',
    })

    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')

    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [12],
      startDates: ['28/01/2019'],
    })
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345YZ'],
      bookingIds: [11],
      startDates: ['2019-01-31'],
    })
    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.task('stubCategorised', {
      bookingIds: [12],
    })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubAgencyDetails', { agency: 'LEI' })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })

    cy.signIn()

    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.doneTabLink().click()

    cy.get('a[href="/form/approvedView/12?sequenceNo=1"]').contains('View').click()
    cy.get('.govuk-warning-text:eq(0)').should('contain.text', 'Warning')
    cy.get('.govuk-warning-text:eq(0)').should('contain.text', 'Category C')
    cy.get('.govuk-warning-text:eq(1)').should('contain.text', 'Warning')
    cy.get('.govuk-warning-text:eq(1)').should('contain.text', 'The categoriser recommends Category C')
    cy.get('.govuk-warning-text:eq(2)').should('contain.text', 'Warning')
    cy.get('.govuk-warning-text:eq(2)').should('contain.text', 'The supervisor also recommends Category C')
    cy.contains('justification test')
  })
})
