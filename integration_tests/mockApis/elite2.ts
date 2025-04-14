import { Response, SuperAgentRequest } from 'superagent'
import { getMatchingRequests, stubFor } from './wiremock'
import moment from 'moment'
import { UserAccount } from '../factory/user'
import { CASELOAD } from '../factory/caseload'
import { AgencyLocation } from '../factory/agencyLocation'

const stubAgencyDetails = ({ agency }: { agency: string }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/agencies/${agency}?activeOnly=false`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        agencyId: agency,
        description: `${agency} prison`,
        agencyType: 'INST',
      },
    },
  })

const stubAgenciesPrison = (): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/agencies/prison`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        { agencyId: 'SYI', description: 'SHREWSBURY (HMP)' },
        { agencyId: 'BXI', description: 'BRIXTON (HMP)' },
        { agencyId: 'MDI', description: 'MOORLAND' },
      ],
    },
  })

const stubAssessments = ({
  offenderNumber,
  emptyResponse = false,
  bookingId = -45,
}: {
  offenderNumber: string
  emptyResponse?: boolean
  bookingId?: number
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/CATEGORY?offenderNo=${offenderNumber}&latestOnly=false&activeOnly=false`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: emptyResponse
        ? []
        : [
            {
              bookingId,
              offenderNo: offenderNumber,
              classificationCode: 'A',
              classification: 'Cat A',
              assessmentCode: 'CATEGORY',
              assessmentDescription: 'Categorisation',
              cellSharingAlertFlag: false,
              assessmentDate: '2012-04-04',
              nextReviewDate: '2012-06-07',
              approvalDate: '2012-06-08',
              assessmentAgencyId: 'LPI',
              assessmentStatus: 'A',
            },
            {
              bookingId,
              offenderNo: offenderNumber,
              classificationCode: 'A',
              classification: 'Cat A',
              assessmentCode: 'CATEGORY',
              assessmentDescription: 'Categorisation',
              cellSharingAlertFlag: false,
              assessmentDate: '2012-03-28',
              nextReviewDate: '2012-06-07',
              assessmentAgencyId: 'LPI',
              assessmentStatus: 'P',
            },
            {
              bookingId,
              offenderNo: offenderNumber,
              classificationCode: 'B',
              classification: 'Cat B',
              assessmentCode: 'CATEGORY',
              assessmentDescription: 'Categorisation',
              cellSharingAlertFlag: false,
              assessmentDate: '2013-03-24',
              nextReviewDate: '2013-09-17',
              approvalDate: '2013-03-24',
              assessmentAgencyId: 'LPI',
              assessmentStatus: 'I',
            },
          ],
    },
  })

const stubAssessmentsWithCurrent = ({ offenderNumber }: { offenderNumber: string }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/CATEGORY?offenderNo=${offenderNumber}&latestOnly=false&activeOnly=false`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId: -45,
          offenderNo: offenderNumber,
          classificationCode: 'A',
          classification: 'Cat A',
          assessmentCode: 'CATEGORY',
          assessmentDescription: 'Categorisation',
          cellSharingAlertFlag: false,
          assessmentDate: '2012-04-04',
          nextReviewDate: '2012-06-07',
          approvalDate: '2012-06-08',
          assessmentAgencyId: 'LPI',
          assessmentStatus: 'A',
          assessmentSeq: 1,
        },
        {
          bookingId: -45,
          offenderNo: offenderNumber,
          classificationCode: 'A',
          classification: 'Cat A',
          assessmentCode: 'CATEGORY',
          assessmentDescription: 'Categorisation',
          cellSharingAlertFlag: false,
          assessmentDate: '2012-03-28',
          nextReviewDate: '2012-06-07',
          assessmentAgencyId: 'LPI',
          assessmentStatus: 'P',
          assessmentSeq: 2,
        },
        {
          bookingId: -45,
          offenderNo: offenderNumber,
          classificationCode: 'B',
          classification: 'Cat B',
          assessmentCode: 'CATEGORY',
          assessmentDescription: 'Categorisation',
          cellSharingAlertFlag: false,
          assessmentDate: '2013-03-24',
          nextReviewDate: '2013-09-17',
          approvalDate: '2013-03-24',
          assessmentAgencyId: 'LPI',
          assessmentStatus: 'I',
          assessmentSeq: 3,
        },
        {
          bookingId: 12,
          offenderNo: offenderNumber,
          classificationCode: 'P',
          classification: 'Prov Cat A',
          assessmentCode: 'CATEGORY',
          assessmentDescription: 'Cat A in current booking',
          cellSharingAlertFlag: false,
          assessmentDate: '2018-04-04',
          nextReviewDate: '2018-06-07',
          approvalDate: '2018-06-08',
          assessmentAgencyId: 'LPI',
          assessmentStatus: 'I',
          assessmentSeq: 4,
        },
        {
          bookingId: 12,
          offenderNo: offenderNumber,
          classificationCode: 'U',
          classification: 'Unsentenced',
          assessmentCode: 'CATEGORY',
          assessmentDescription: 'Current booking',
          cellSharingAlertFlag: false,
          assessmentDate: '2019-03-28',
          nextReviewDate: '2019-06-07',
          approvalDate: '2019-06-18',
          assessmentAgencyId: 'LPI',
          assessmentStatus: 'A',
          assessmentSeq: 5,
        },
      ],
    },
  })

const stubAssessmentsWomen = ({
  offenderNo,
  emptyResponse = false,
  bookingId = -45,
}: {
  offenderNo: string
  emptyResponse?: boolean
  bookingId?: number
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false&activeOnly=false`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: emptyResponse
        ? []
        : [
            {
              bookingId,
              offenderNo,
              classification: 'No Cat A',
              assessmentCode: 'CATEGORY',
              assessmentDescription: 'Categorisation',
              cellSharingAlertFlag: false,
              assessmentDate: '2012-04-04',
              nextReviewDate: '2012-06-07',
              approvalDate: '2012-06-08',
              assessmentAgencyId: 'PFI',
              assessmentStatus: 'No CAT A, Restricted',
            },
          ],
    },
  })

const stubCategorise = ({
  expectedCat,
  nextReviewDate,
  bookingId = 700,
  committee = 'OCA',
  sequenceNumber = 4,
}: {
  expectedCat: string
  nextReviewDate: string
  bookingId: number
  committee: string
  sequenceNumber: number
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'POST',
      url: '/elite2/api/offender-assessments/category/categorise',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        expectedCat,
        nextReviewDate,
        bookingId,
        committee,
        sequenceNumber,
      },
    },
  })

const stubCategoriseUpdate = ({
  expectedCat,
  nextReviewDate,
  bookingId,
  sequenceNumber,
}: {
  expectedCat: string
  nextReviewDate: string
  bookingId: number
  sequenceNumber: number
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'PUT',
      url: '/elite2/api/offender-assessments/category/categorise',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        expectedCat,
        nextReviewDate,
        bookingId,
        committee: 'OCA',
        sequenceNumber,
      },
    },
  })

const stubCategorised = ({ bookingIds }: { bookingIds: number[] }): SuperAgentRequest => {
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
}
const stubCategorisedMultiple = ({ bookingIds }: { bookingIds: number[] } = { bookingIds: [] }): SuperAgentRequest => {
  const response = []
  if (bookingIds.includes(10)) {
    response.push({
      offenderNo: 'B1234AB',
      bookingId: 10,
      firstName: 'PETER',
      lastName: 'PERFECT',
      assessmentDate: '2018-03-28',
      approvalDate: '2019-01-19',
      assessmentSeq: 5,
      categoriserFirstName: 'SIMON',
      categoriserLastName: 'TABLE',
      approverFirstName: 'SAM',
      approverLastName: 'HAND',
      category: 'B',
    })
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
      approvalDate: '2019-02-28',
      assessmentSeq: 7,
      categoriserFirstName: 'JANE',
      categoriserLastName: 'FAN',
      approverFirstName: 'JAMES',
      approverLastName: 'HELLY',
      category: 'C',
    })
    response.push({
      offenderNo: 'B2345YZ',
      bookingId: 11,
      firstName: 'SARAH',
      lastName: 'HEMMEL',
      assessmentDate: '2017-04-28',
      approvalDate: '2019-04-29',
      assessmentSeq: 8,
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
      approverFirstName: 'JAMES',
      approverLastName: 'HELLY',
      category: 'C',
    })
    response.push({
      offenderNo: 'B2345XY',
      bookingId: 12,
      firstName: 'TIM',
      lastName: 'SCRAMBLE',
      assessmentDate: '2017-03-27',
      approvalDate: '2019-04-20',
      assessmentSeq: 8,
      categoriserFirstName: 'JOHN',
      categoriserLastName: 'LAMB',
      approverFirstName: 'JAMES',
      approverLastName: 'HELLY',
      category: 'C',
    })
  }
  return stubFor({
    request: {
      method: 'POST',
      url: '/elite2/api/offender-assessments/category?latestOnly=false',
      bodyPatterns: [
        {
          equalToJson: JSON.stringify(bookingIds),
          ignoreArrayOrder: true,
          ignoreExtraElements: true,
        },
      ],
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: response,
    },
  })
}

const stubElite2Ping = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/elite2/health/ping`,
    },
    response: {
      status: statusCode,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        status: statusCode,
        response: {},
      },
    },
  })

const stubGetMyCaseloads = ({ caseloads } = { caseloads: [CASELOAD.LEI] }): SuperAgentRequest =>
  stubFor({
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

const stubGetMyDetails = ({ user, caseloadId }: { user: UserAccount; caseloadId: string }): SuperAgentRequest =>
  stubFor({
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

const stubGetOffenderDetails = ({
  bookingId,
  offenderNo = 'B2345YZ',
  youngOffender = false,
  indeterminateSentence = false,
  category = 'C',
  multipleSentences = false,
  nextReviewDate = '2020-01-16',
  basicInfo = false,
  paroleEligibilityDate = '2020-06-13',
  conditionalReleaseDate = '2020-02-02',
}: {
  bookingId: number
  offenderNo?: string
  youngOffender?: boolean
  indeterminateSentence?: boolean
  category?: string
  multipleSentences?: boolean
  nextReviewDate?: string
  basicInfo?: boolean
  paroleEligibilityDate?: string
  conditionalReleaseDate?: string
}): Promise<Response[]> => {
  const stubBasicInfo = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}?basicInfo=${basicInfo}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          offenderNo,
          agencyId: 'LEI',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          dateOfBirth: youngOffender ? '2018-01-01' : '1970-02-17',
          category: 'Cat ' + category,
          categoryCode: category,
          assessments: nextReviewDate ? [{ assessmentCode: 'CATEGORY', nextReviewDate }] : null,
          assignedLivingUnit: { description: 'C-04-02', agencyName: 'Coventry' },
          profileInformation: [
            { type: 'IMM', resultValue: 'Other' },
            { type: 'NAT', resultValue: 'Latvian' },
          ],
        }),
      },
    })

  const sentenceDetail: { [key: string]: any } = {
    bookingId,
    sentenceStartDate: '2019-08-15',
    homeDetentionCurfewEligibilityDate: '2020-06-10',
    paroleEligibilityDate: paroleEligibilityDate,
    nonParoleDate: '2020-06-14',
    tariffDate: '2020-06-15',
    licenceExpiryDate: '2020-06-16',
    sentenceExpiryDate: '2020-06-17',
  }
  if (!indeterminateSentence) {
    sentenceDetail.releaseDate = new Date().toISOString().substring(0, 10)
    sentenceDetail.conditionalReleaseDate = conditionalReleaseDate
    sentenceDetail.confirmedReleaseDate = new Date(new Date().getFullYear() + 4, 0, 1).toISOString().substring(0, 10)
    sentenceDetail.automaticReleaseDate = '2020-06-11'
  }

  const stubSentenceDetail = () =>
    stubFor({
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

  const terms: { [key: string]: any }[] = [
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

  const stubSentenceTerms = () =>
    stubFor({
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

  const stubMainOffence = (): SuperAgentRequest =>
    stubFor({
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

  return Promise.all([stubBasicInfo(), stubSentenceDetail(), stubSentenceTerms(), stubMainOffence()])
}

const stubGetOffenderDetailsByOffenderNoList = ({
  bookingId = [13, 14],
  offenderNumbers,
}: {
  bookingId: number[]
  offenderNumbers: string[]
}): SuperAgentRequest =>
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
          bookingId: bookingId[0],
          offenderNo: offenderNumbers[0],
          agencyId: 'LEI',
          firstName: 'FRANK',
          lastName: 'CLARK',
          dateOfBirth: '1970-02-17',
        },
        {
          bookingId: bookingId[1],
          offenderNo: offenderNumbers[1],
          agencyId: 'LEI',
          firstName: 'JANE',
          lastName: 'DENT',
          dateOfBirth: '1970-02-17',
        },
      ]),
    },
  })

const stubGetOffenderDetailsWomen = ({
  bookingId,
  offenderNo = 'ON700',
  youngOffender = false,
  indeterminateSentence = false,
  category = 'R',
  multipleSentences = false,
  nextReviewDate = '2020-01-16',
}: {
  bookingId: number
  offenderNo?: string
  youngOffender?: boolean
  indeterminateSentence?: boolean
  category?: string
  multipleSentences?: boolean
  nextReviewDate?: string
}): Promise<Response[]> => {
  const stubBasicInfo = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}?basicInfo=false`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          offenderNo,
          agencyId: 'PFI',
          firstName: 'WILLIAM',
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
        }),
      },
    })

  const sentenceDetail = {
    bookingId,
    sentenceStartDate: '2019-08-15',
    homeDetentionCurfewEligibilityDate: '2020-06-10',
    paroleEligibilityDate: '2020-06-13',
    nonParoleDate: '2020-06-14',
    tariffDate: '2020-06-15',
    licenceExpiryDate: '2020-06-16',
    sentenceExpiryDate: '2020-06-17',
    releaseDate: undefined,
    conditionalReleaseDate: undefined,
    confirmedReleaseDate: undefined,
    automaticReleaseDate: undefined,
  }

  if (!indeterminateSentence) {
    sentenceDetail.releaseDate = new Date()
    sentenceDetail.conditionalReleaseDate = '2020-02-02'
    sentenceDetail.confirmedReleaseDate = moment().add(4, 'years').format('yyyy-MM-DD') // > 3
    sentenceDetail.automaticReleaseDate = '2020-06-11'
  }

  const stubSentenceDetail = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}/sentenceDetail`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sentenceDetail),
      },
    })

  const terms = [
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
      consecutiveTo: undefined,
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

  const stubSentenceTerms = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/offender-sentences/booking/${bookingId}/sentenceTerms`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(terms),
      },
    })

  const stubMainOffence = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}/mainOffence`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          { bookingId, offenceDescription: 'A Felony' },
          { bookingId, offenceDescription: 'Another Felony' },
        ]),
      },
    })

  return Promise.all([stubBasicInfo(), stubSentenceDetail(), stubSentenceTerms(), stubMainOffence()])
}

const stubGetOffenderDetailsWomenYOI = ({
  bookingId,
  offenderNo = 'C0001AA',
  youngOffender = true,
  indeterminateSentence = false,
  category,
  multipleSentences = false,
  nextReviewDate = '2020-01-16',
}: {
  bookingId: number
  offenderNo?: string
  youngOffender?: boolean
  indeterminateSentence?: boolean
  category: string
  multipleSentences?: boolean
  nextReviewDate?: string
}): Promise<Response[]> => {
  const stubBasicInfo = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}?basicInfo=false`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          offenderNo,
          agencyId: 'PFI',
          firstName: 'TINY',
          lastName: 'TIM',
          dateOfBirth: youngOffender ? '2005-01-01' : '1970-02-17',
          category: 'Cat ' + category,
          categoryCode: category,
          assessments: nextReviewDate ? [{ assessmentCode: 'CATEGORY', nextReviewDate: nextReviewDate }] : null,
          assignedLivingUnit: { description: 'C-04-02', agencyName: 'Coventry' },
          profileInformation: [
            { type: 'IMM', resultValue: 'Other' },
            { type: 'NAT', resultValue: 'Latvian' },
          ],
        }),
      },
    })

  const sentenceDetail = {
    bookingId,
    sentenceStartDate: '2019-08-15',
    homeDetentionCurfewEligibilityDate: '2020-06-10',
    paroleEligibilityDate: '2020-06-13',
    nonParoleDate: '2020-06-14',
    tariffDate: '2020-06-15',
    licenceExpiryDate: '2020-06-16',
    sentenceExpiryDate: '2020-06-17',
    releaseDate: undefined,
    conditionalReleaseDate: undefined,
    confirmedReleaseDate: undefined,
    automaticReleaseDate: undefined,
  }

  if (!indeterminateSentence) {
    sentenceDetail.releaseDate = new Date()
    sentenceDetail.conditionalReleaseDate = '2020-02-02'
    sentenceDetail.confirmedReleaseDate = moment().add(4, 'years').format('yyyy-MM-DD') // > 3
    sentenceDetail.automaticReleaseDate = '2020-06-11'
  }

  const stubSentenceDetail = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}/sentenceDetail`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sentenceDetail),
      },
    })

  const terms = [
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
  const stubSentenceTerms = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/offender-sentences/booking/${bookingId}/sentenceTerms`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(terms),
      },
    })

  const stubMainOffence = () =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/bookings/${bookingId}/mainOffence`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          { bookingId, offenceDescription: 'A Felony' },
          { bookingId, offenceDescription: 'Another Felony' },
        ]),
      },
    })

  return Promise.all([stubBasicInfo(), stubSentenceDetail(), stubSentenceTerms(), stubMainOffence()])
}

const stubGetUserDetails = ({ user, caseloadId }: { user: UserAccount; caseloadId: string }): SuperAgentRequest =>
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
  })

const stubGetStaffDetailsByUsernameList = ({ usernames } = { usernames: [] }): SuperAgentRequest =>
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
        })),
      ),
    },
  })

const stubOffenceHistory = ({ offenderNumber }: { offenderNumber: string }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/bookings/offenderNo/${offenderNumber}/offenceHistory`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: [
        { bookingId: 12, offenceDescription: 'Libel', offenceDate: '2019-02-21' },
        { bookingId: 12, offenceDescription: 'Slander', offenceDate: '2019-02-22', offenceRangeDate: '2019-02-24' },
        { bookingId: 12, offenceDescription: 'Undated offence' },
      ],
    },
  })

const stubSentenceDataGetSingle = ({
  offenderNumber,
  formattedReleaseDate,
}: {
  offenderNumber: string
  formattedReleaseDate: string
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-sentences?offenderNo=${offenderNumber}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          offenderNo: offenderNumber,
          bookingId: -45,
          firstName: 'firstName',
          lastName: 'lastName',
          sentenceDetail: { bookingId: -45, releaseDate: formattedReleaseDate },
        },
        {
          offenderNo: offenderNumber,
          bookingId: -55,
          firstName: 'firstName',
          lastName: 'lastName',
          sentenceDetail: { bookingId: -55, releaseDate: formattedReleaseDate },
        },
        {
          offenderNo: offenderNumber,
          bookingId: 12,
          firstName: 'firstName12',
          lastName: 'lastName12',
          sentenceDetail: { bookingId: 12, releaseDate: '2020-11-30' },
        },
      ]),
    },
  })

const stubSupervisorApprove = (): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'PUT',
      url: `/elite2/api/offender-assessments/category/approve`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {},
    },
  })

const stubSupervisorApproveNoPendingAssessmentError = ({
  category,
  bookingId,
  assessmentSeq,
}: {
  category: string
  bookingId: number
  assessmentSeq: number
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'PUT',
      url: `/elite2/api/offender-assessments/category/approve`,
    },
    response: {
      status: 400,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        developerMessage: '400 No pending category assessment found, $category, booking $bookingId, seq $assessmentSeq',
        status: 400,
        userMessage: 'No pending category assessment found, category $category, booking $bookingId, seq $assessmentSeq',
      },
    },
  })

const stubSupervisorReject = (): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'PUT',
      url: `/elite2/api/offender-assessments/category/reject`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {},
    },
  })

const verifySupervisorApprove = ({ date }: { date: string }) =>
  getMatchingRequests({
    method: 'PUT',
    urlPath: `/elite2/api/offender-assessments/category/approve`,
  }).then(data => {
    try {
      return JSON.parse(data.text)
    } catch (e) {
      return []
    }
  })

const stubUncategorised = (): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/category/LEI?type=UNCATEGORISED`,
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
  })

const stubUncategorisedFull = (): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/category/LEI?type=UNCATEGORISED`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId: 31,
          offenderNo: 'B0031AA',
          firstName: 'AWAITING',
          lastName: 'MISSING',
          status: 'AWAITING_APPROVAL',
          category: 'B',
        },
        {
          bookingId: 32,
          offenderNo: 'B0032AA',
          firstName: 'AWAITING',
          lastName: 'STARTED',
          status: 'AWAITING_APPROVAL',
          category: 'C',
        },
        {
          bookingId: 33,
          offenderNo: 'B0033AA',
          firstName: 'AWAITING',
          lastName: 'AWAITING',
          status: 'AWAITING_APPROVAL',
          category: 'B',
        },
        {
          bookingId: 34,
          offenderNo: 'B0034AA',
          firstName: 'AWAITING',
          lastName: 'APPROVED',
          status: 'AWAITING_APPROVAL',
          category: 'C',
        },
        {
          bookingId: 35,
          offenderNo: 'B0035AA',
          firstName: 'UNCATEGORISED',
          lastName: 'MISSING',
          status: 'UNCATEGORISED',
          category: 'B',
        },
        {
          bookingId: 36,
          offenderNo: 'B0036AA',
          firstName: 'UNCATEGORISED',
          lastName: 'STARTED',
          status: 'UNCATEGORISED',
          category: 'C',
        },
        {
          bookingId: 37,
          offenderNo: 'B0037AA',
          firstName: 'UNCATEGORISED',
          lastName: 'AWAITING',
          status: 'UNCATEGORISED',
          category: 'B',
        },
        {
          bookingId: 38,
          offenderNo: 'B0038AA',
          firstName: 'UNCATEGORISED',
          lastName: 'APPROVED',
          status: 'UNCATEGORISED',
          category: 'C',
        },
        {
          bookingId: 39,
          offenderNo: 'B0039AA',
          firstName: 'AWAITING',
          lastName: 'SUPERVISOR_BACK',
          status: 'AWAITING_APPROVAL',
          category: 'C',
        },
      ],
    },
  })

const stubUncategorisedAwaitingApproval = (
  { emptyResponse = false, bookingIds = [] } = {
    emptyResponse: false,
    bookingIds: [],
  },
): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/category/LEI?type=UNCATEGORISED`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: emptyResponse
        ? []
        : (() => {
            const allOffenders = [
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
                nextReviewDate: '2025-01-01',
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
                nextReviewDate: '2025-02-02',
              },
              {
                bookingId: 13,
                offenderNo: 'B2345ZZ',
                firstName: 'Test',
                lastName: 'Newcomer',
                status: 'AWAITING_APPROVAL',
                category: 'D',
                categoriserFirstName: 'Daffy',
                categoriserLastName: 'Duck',
                assessmentSeq: 5,
                nextReviewDate: '2025-02-02',
              },
            ]

            return bookingIds.length > 0
              ? allOffenders.filter(offender => bookingIds.includes(offender.bookingId))
              : allOffenders.filter(offender => offender.bookingId !== 13)
          })(),
    },
  })

const stubUncategorisedAwaitingApprovalForWomenYOI = (location: AgencyLocation['id']): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/category/${location}?type=UNCATEGORISED`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId: 21,
          offenderNo: 'C0001AA',
          firstName: 'TINY',
          lastName: 'TIM',
          status: 'AWAITING_APPROVAL',
          category: 'I',
          categoriserFirstName: 'BUGS',
          categoriserLastName: 'BUNNY',
          assessmentSeq: 5,
        },
      ],
    },
  })

const stubUncategorisedAwaitingApprovalWithLocation = (location: AgencyLocation['id']): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/category/${location}?type=UNCATEGORISED`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId: 700,
          offenderNo: 'ON700',
          firstName: 'WILLIAM',
          lastName: 'HILLMOB',
          status: 'AWAITING_APPROVAL',
          category: 'R',
          categoriserFirstName: 'BUGS',
          categoriserLastName: 'BUNNY',
          assessmentSeq: 5,
        },
      ],
    },
  })

const stubUncategorisedForWomenYOI = ({
  bookingId,
  location = 'LEI',
}: {
  bookingId: number
  location: AgencyLocation['id']
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/category/${location}?type=UNCATEGORISED`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId: bookingId,
          offenderNo: 'C0001AA',
          firstName: 'TINY',
          lastName: 'TIM',
          status: 'UNCATEGORISED',
        },
      ],
    },
  })

const stubUncategorisedNoStatus = ({
  bookingId,
  location = 'LEI',
}: {
  bookingId: number
  location: AgencyLocation['id']
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/category/${location}?type=UNCATEGORISED`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId,
          offenderNo: `ON${bookingId}`,
          prisonId: location,
          firstName: location === 'LEI' ? 'HARRY' : 'WILLIAM',
          lastName: 'BONNET',
          status: 'UNCATEGORISED',
        },
      ],
    },
  })

const stubUpdateNextReviewDate = ({ date }: { date: string }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'PUT',
      url: `/elite2/api/offender-assessments/category/12/nextReviewDate/${date}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {},
    },
  })

const verifyUpdateNextReviewDate = ({ date }: { date: string }) =>
  getMatchingRequests({
    method: 'PUT',
    urlPath: `/elite2/api/offender-assessments/category/12/nextReviewDate/${date}`,
  }).then(data => {
    try {
      return JSON.parse(data.text)
    } catch (e) {
      return []
    }
  })

const stubRecategorise = (
  { recategorisations, latestOnly, agencyId = 'LEI' } = {
    recategorisations: undefined,
    latestOnly: undefined,
    agencyId: undefined,
  },
) => {
  let recategorisationsResponse = recategorisations
  if (typeof recategorisations === 'undefined' || !Array.isArray(recategorisations)) {
    recategorisationsResponse = [
      {
        bookingId: 12,
        offenderNo: 'B2345XY',
        firstName: 'PENELOPE',
        lastName: 'PITSTOP',
        category: 'C',
        nextReviewDate: moment().subtract(4, 'days').format('yyyy-MM-DD'),
        assessStatus: 'A',
      },
      {
        bookingId: 11,
        offenderNo: 'B2345YZ',
        firstName: 'ANT',
        lastName: 'HILLMOB',
        category: 'D',
        nextReviewDate: moment().subtract(2, 'days').format('yyyy-MM-DD'),
        assessStatus: 'A',
      },
    ]
  }
  const twoMonthsFromToday = moment().add(2, 'months').format('yyyy-MM-DD')

  const recategorisationsStub = agencyId =>
    stubFor({
      request: {
        method: 'GET',
        url: `/elite2/api/offender-assessments/category/${agencyId}?type=RECATEGORISATIONS&date=${twoMonthsFromToday}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: recategorisationsResponse,
      },
    })

  let latestOnlyResponse = latestOnly
  if (typeof latestOnly === 'undefined' || !Array.isArray(latestOnly)) {
    latestOnlyResponse = [
      {
        bookingId: 21,
        offenderNo: 'C0001AA',
        classificationCode: 'C',
        nextReviewDate: moment().subtract(4, 'days').format('yyyy-MM-DD'),
        assessmentStatus: 'A',
      },
      {
        bookingId: 22,
        offenderNo: 'C0002AA',
        classificationCode: 'D',
        nextReviewDate: moment().subtract(2, 'days').format('yyyy-MM-DD'),
        assessmentStatus: 'A',
      },
    ]
  }
  const latestOnlyStub = () =>
    stubFor({
      request: {
        method: 'POST',
        url: `/elite2/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: latestOnlyResponse,
      },
    })

  return Promise.all([recategorisationsStub(agencyId), latestOnlyStub()])
}

const getOffenderStub = ({ offenderNumber }: { offenderNumber: string }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/elite2/api/offender-assessments/CATEGORY?offenderNo=${offenderNumber}&latestOnly=false&activeOnly=false`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId: 11,
          offenderNo: offenderNumber,
          classificationCode: 'C',
          nextReviewDate: moment().subtract(4, 'days').format('yyyy-MM-DD'),
          assessmentStatus: 'A',
        },
      ],
    },
  })

const stubAdjudicationHearings = ({
  agencyId,
  fromDate,
  toDate,
}: {
  agencyId: string
  fromDate: string
  toDate: string
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'POST',
      url: `/elite2/api/offenders/adjudication-hearings?agencyId=${agencyId}&fromDate=${fromDate}&toDate=${toDate}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [],
    },
  })

export default {
  stubAgencyDetails,
  stubAgenciesPrison,
  stubAssessments,
  stubAssessmentsWithCurrent,
  stubAssessmentsWomen,
  stubCategorise,
  stubCategoriseUpdate,
  stubCategorised,
  stubCategorisedMultiple,
  stubElite2Ping,
  stubGetMyCaseloads,
  stubGetMyDetails,
  stubGetOffenderDetails,
  stubGetOffenderDetailsByOffenderNoList,
  stubGetOffenderDetailsWomen,
  stubGetOffenderDetailsWomenYOI,
  stubGetUserDetails,
  stubGetStaffDetailsByUsernameList,
  stubOffenceHistory,
  stubSentenceDataGetSingle,
  stubSupervisorApprove,
  stubSupervisorApproveNoPendingAssessmentError,
  stubSupervisorReject,
  stubUncategorised,
  stubUncategorisedFull,
  stubUncategorisedAwaitingApproval,
  stubUncategorisedAwaitingApprovalForWomenYOI,
  stubUncategorisedAwaitingApprovalWithLocation,
  stubUncategorisedForWomenYOI,
  stubUncategorisedNoStatus,
  stubUpdateNextReviewDate,
  verifySupervisorApprove,
  verifyUpdateNextReviewDate,
  stubRecategorise,
  stubAdjudicationHearings,
  getOffenderStub,
}
