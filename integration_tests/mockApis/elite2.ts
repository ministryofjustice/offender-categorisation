import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { leiCaseload, UserAccount } from '../factory/user'
import moment from 'moment'

interface SentenceDetail {
  bookingId: number
  sentenceStartDate: string
  homeDetentionCurfewEligibilityDate: string
  paroleEligibilityDate: string
  nonParoleDate: string
  tariffDate: string
  licenceExpiryDate: string
  sentenceExpiryDate: string
  releaseDate?: string
  conditionalReleaseDate?: string
  confirmedReleaseDate?: string
  automaticReleaseDate?: string
}

interface Term {
  bookingId: number
  sentenceSequence: number
  termSequence: number
  consecutiveTo?: number
  sentenceType: string
  sentenceTypeDescription: string
  startDate: string
  years: number
  months: number
  lifeSentence: boolean
}

export default {
  stubCategorised: ({ bookingIds }: { bookingIds: number[] }): SuperAgentRequest => {
    const response = []
    if (bookingIds.includes(10)) {
      response.push({
        offenderNo: 'B1234AB',
        bookingId: 10,
        firstName: 'PETER',
        lastName: 'PERFECT',
        assessmentDate: '2018-03-28',
        approvalDate: '2019-03-20',
        assessmentSeq: 7,
        categoriserFirstName: 'DICK',
        categoriserLastName: 'DASTARDLY',
        approverFirstName: 'PAT',
        approverLastName: 'PENDING',
        category: 'B',
      })
    }
    if (bookingIds.includes(11)) {
      response.push({
        offenderNo: 'B2345YZ',
        bookingId: 11,
        firstName: 'SARAH',
        lastName: 'HEMMEL',
        assessmentDate: '2017-03-27',
        approvalDate: '2019-02-20',
        assessmentSeq: 7,
        categoriserFirstName: 'JANE',
        categoriserLastName: 'FAN',
        approverFirstName: 'JAMES',
        approverLastName: 'HELLY',
        category: 'C',
      })
    }
    if (bookingIds.includes(12)) {
      response.push({
        offenderNo: 'B2345XY',
        bookingId: 12,
        firstName: 'TIM',
        lastName: 'SCRAMBLE',
        assessmentDate: '2017-03-27',
        approvalDate: '2019-02-21',
        assessmentSeq: 7,
        categoriserFirstName: 'JOHN',
        categoriserLastName: 'LAMB',
        category: 'C',
      })
    }
    if (bookingIds.includes(700)) {
      response.push({
        offenderNo: 'ON700',
        bookingId: 700,
        firstName: 'WILLIAM',
        lastName: 'HILLMOB',
        assessmentDate: '2017-03-27',
        approvalDate: '2019-02-21',
        assessmentSeq: 7,
        categoriserFirstName: 'JOHN',
        categoriserLastName: 'LAMB',
        category: 'R',
      })
    }
    return stubFor({
      request: {
        method: 'POST',
        url: '/elite2/api/offender-assessments/category?latestOnly=false',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: response,
      },
    })
  },
  stubElite2Ping: (statusCode = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/elite2/ping`,
      },
      response: {
        status: statusCode,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: statusCode,
          response: {},
        },
      },
    }),
  stubGetMyCaseloads: ({ caseloads } = { caseloads: [leiCaseload] }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/elite2/api/users/me/caseLoads',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: caseloads.map(caseload => ({
          caseLoadId: caseload.id,
          description: caseload.description,
          type: caseload.type,
          caseloadFunction: 'DUMMY',
        })),
      },
    })
  },
  stubGetMyDetails: ({ user, caseloadId }: { user: UserAccount; caseloadId: string }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/elite2/api/users/me',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: {
          staffId: user.staffMember.id,
          username: user.username,
          firstName: user.staffMember.firstName,
          lastName: user.staffMember.lastName,
          email: 'itaguser@syscon.net',
          activeCaseLoadId: caseloadId,
        },
      },
    })
  },
  stubGetOffenderDetailsBasicInfo({
    bookingId,
    offenderNo = 'B2345YZ',
    youngOffender = false,
    category = 'C',
    nextReviewDate = '2020-01-16',
  }: {
    bookingId: number
    offenderNo: string
    youngOffender: boolean
    category: string
    nextReviewDate: string
  }): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}?basicInfo=false`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: {
          bookingId,
          offenderNo,
          agencyId: 'LEI',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          dateOfBirth: youngOffender ? '2018-01-01' : '1970-02-17',
          category: `Cat ${category}`,
          categoryCode: category,
          assessments: nextReviewDate ? [{ assessmentCode: 'CATEGORY', nextReviewDate }] : null,
          assignedLivingUnit: { description: 'C-04-02', agencyName: 'Coventry' },
          profileInformation: [
            { type: 'IMM', resultValue: 'Other' },
            { type: 'NAT', resultValue: 'Latvian' },
          ],
        },
      },
    })
  },
  stubGetOffenderDetailsMainOffence({ bookingId }: { bookingId: number }): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}/mainOffence`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: [
          { bookingId, offenceDescription: 'A Felony' },
          { bookingId, offenceDescription: 'Another Felony' },
        ],
      },
    })
  },
  stubGetOffenderDetailsSentenceDetail({
    bookingId,
    indeterminateSentence = false,
  }: {
    bookingId: number
    indeterminateSentence: boolean
    multipleSentences: boolean
  }): SuperAgentRequest {
    const sentenceDetail: { [key: string]: string | number } = {
      bookingId,
      sentenceStartDate: '2019-08-15',
      homeDetentionCurfewEligibilityDate: '2020-06-10',
      paroleEligibilityDate: '2020-06-13',
      nonParoleDate: '2020-06-14',
      tariffDate: '2020-06-15',
      licenceExpiryDate: '2020-06-16',
      sentenceExpiryDate: '2020-06-17',
    }

    if (!indeterminateSentence) {
      sentenceDetail.releaseDate = moment().format('YYYY-MM-DD')
      sentenceDetail.conditionalReleaseDate = '2020-02-02'
      sentenceDetail.confirmedReleaseDate = moment().add(4, 'years').format('YYYY-MM-DD')
      sentenceDetail.automaticReleaseDate = '2020-06-11'
    }

    return stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}/sentenceDetail`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: sentenceDetail,
      },
    })
  },
  stubGetOffenderDetailsSentenceTerms({
    bookingId,
    indeterminateSentence = false,
    multipleSentences = false,
  }: {
    bookingId: number
    indeterminateSentence: boolean
    multipleSentences: boolean
  }): SuperAgentRequest {
    const sentenceDetail: { [key: string]: string | number } = {
      bookingId,
      sentenceStartDate: '2019-08-15',
      homeDetentionCurfewEligibilityDate: '2020-06-10',
      paroleEligibilityDate: '2020-06-13',
      nonParoleDate: '2020-06-14',
      tariffDate: '2020-06-15',
      licenceExpiryDate: '2020-06-16',
      sentenceExpiryDate: '2020-06-17',
    }

    if (!indeterminateSentence) {
      sentenceDetail.releaseDate = moment().format('YYYY-MM-DD')
      sentenceDetail.conditionalReleaseDate = '2020-02-02'
      sentenceDetail.confirmedReleaseDate = moment().add(4, 'years').format('YYYY-MM-DD')
      sentenceDetail.automaticReleaseDate = '2020-06-11'
    }

    const terms: Term[] = [
      {
        bookingId,
        sentenceSequence: 2,
        termSequence: 1,
        sentenceType: 'T1',
        sentenceTypeDescription: 'Std sentence',
        startDate: '2018-12-31',
        years: 6,
        months: 3,
        lifeSentence: indeterminateSentence,
      },
    ]

    if (multipleSentences) {
      terms.push({
        bookingId,
        sentenceSequence: 4,
        termSequence: 1,
        consecutiveTo: 2,
        sentenceType: 'R',
        sentenceTypeDescription: 'Recall 14 days',
        startDate: '2019-03-31',
        years: 4,
        months: 2,
        lifeSentence: false,
      })
    }

    return stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/offender-sentences/booking/${bookingId}/sentenceTerms`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: terms,
      },
    })
  },
  stubGetOffenderDetailsByOffenderNoList: ({ offenderNumbers }: { offenderNumbers: string[] }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: '/elite2/api/bookings/offenders?activeOnly=false',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            bookingId: 13,
            offenderNo: offenderNumbers[0],
            agencyId: 'LEI',
            firstName: 'FRANK',
            lastName: 'CLARK',
            dateOfBirth: '1970-02-17',
          },
          {
            bookingId: 14,
            offenderNo: offenderNumbers[1],
            agencyId: 'LEI',
            firstName: 'JANE',
            lastName: 'DENT',
            dateOfBirth: '1970-02-17',
          },
        ]),
      },
    }),
  stubGetUserDetails: ({ user, caseloadId }: { user: UserAccount; caseloadId: string }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/users/${user.username}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: {
          staffId: user.staffMember.id,
          username: user.username,
          firstName: user.staffMember.firstName,
          lastName: user.staffMember.lastName,
          email: 'itaguser@syscon.net',
          activeCaseLoadId: caseloadId,
        },
      },
    }),
  stubGetStaffDetailsByUsernameList: ({ usernames = [] }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: '/elite2/api/users/list',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          usernames.map(username => ({
            staffId: 123,
            username: username,
            firstName: `firstName_${username}`,
            lastName: `lastName_${username}`,
            email: 'itaguser@syscon.net',
            activeCaseLoadId: 'LEI',
          }))
        ),
      },
    }),
  stubUncategorised: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/elite2/api/offender-assessments/category/LEI?type=UNCATEGORISED`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            bookingId: 12,
            offenderNo: 'B2345XY',
            firstName: 'PENELOPE',
            lastName: 'PITSTOP',
            status: 'UNCATEGORISED',
            assessmentSeq: 5,
          },
          {
            bookingId: 11,
            offenderNo: 'B2345YZ',
            firstName: 'ANT',
            lastName: 'HILLMOB',
            status: 'AWAITING_APPROVAL',
            assessmentSeq: 4,
          },
        ],
      },
    }),
  stubUncategorisedAwaitingApproval: (statusCode = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/elite2/api/offender-assessments/category/LEI?type=UNCATEGORISED`,
      },
      response: {
        status: statusCode,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: statusCode,
          response: [
            {
              bookingId: 11,
              offenderNo: 'B2345XY',
              firstName: 'PENELOPE',
              lastName: 'PITSTOP',
              status: 'AWAITING_APPROVAL',
              category: 'B',
              categoriserFirstName: 'ROGER',
              categoriserLastName: 'RABBIT',
              assessmentSeq: 4,
            },
            {
              bookingId: 12,
              offenderNo: 'B2345YZ',
              firstName: 'ANT',
              lastName: 'HILLMOB',
              status: 'AWAITING_APPROVAL',
              category: 'C',
              categoriserFirstName: 'BUGS',
              categoriserLastName: 'BUNNY',
              assessmentSeq: 5,
            },
          ],
        },
      },
    }),
}
