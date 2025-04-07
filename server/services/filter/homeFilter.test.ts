import makeTestPrisoner from '../../../test/factories/prisoner.test-factory'
import {
  filterListOfPrisoners,
  LOW_RISK_OF_ESCAPE,
  LOW_ROSH,
  NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS,
  NO_CURRENT_TERRORISM_OFFENCES,
  NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS,
  NOT_MARKED_AS_NOT_FOR_RELEASE,
  OVERDUE,
  REVIEWS_ASSIGNED_TO_ME,
  STANDARD_OR_ENHANCED_INCENTIVE_LEVEL,
  TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS,
} from './homeFilter'
import makeTestRecategorisationPrisonerSearchDto from '../recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto.test-factory'
import makeTestPrisonerSearchAlertDto from '../../data/prisonerSearch/alert/prisonerSearchAlert.dto.test-factory'
import {
  ESCAPE_RISK_ALERT_CODE,
  NOT_FOR_RELEASE_ALERT_CODE,
  ROTL_SUSPENSION_ALERT_CODE,
  TERRORIST_ACT_ALERT_CODE,
} from '../../data/prisonerSearch/alert/prisonerSearchAlert.dto'
import makeTestPrisonerSearchIncentiveLevelDto from '../../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto.test-factory'
import {
  INCENTIVE_LEVEL_BASIC,
  INCENTIVE_LEVEL_STANDARD,
} from '../../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto'
import makeTestNomisAdjudicationHearingDto from '../../data/nomis/adjudicationHearings/nomisAdjudicationHearing.dto.test-factory'
import makeTestRecategorisationHomeFiltersFilter from './recategorisationHomeFilter.test-factory'
import makeTestPrisonerAllocationDto from '../../data/allocationManager/prisonerAllocation.dto.test-factory'
import makeTestAllocatedPomDto from '../../data/allocationManager/allocatedPom.dto.test-factory'
import { makeTestProbationOffenderSearchOffenderDto } from '../../data/probationOffenderSearch/probationOffenderSearchOffender.dto.test-factory'
import { makeTestRiskSummaryDto } from '../../data/risksAndNeeds/riskSummary.dto.test-factory'
import { OverallRiskLevel } from '../../data/risksAndNeeds/riskSummary.dto'

const nomisClient = {
  getOffenderAdjudications: jest.fn(),
}

const risksAndNeedsClient = {
  getRisksSummary: jest.fn(),
}

const probationOffenderSearchApiClient = {
  matchPrisoners: jest.fn(),
}

const testOffenderNumber = 'ABC123'
const testBookingId = 12345
const testPrisoners = [makeTestPrisoner(testBookingId, testOffenderNumber)]
const testAgencyId = 'ABC'
const testUserStaffId = 123

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2024-01-01'))
})

afterAll(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

afterEach(() => {
  nomisClient.getOffenderAdjudications.mockReset()
  risksAndNeedsClient.getRisksSummary.mockReset()
  probationOffenderSearchApiClient.matchPrisoners.mockReset()
})

describe('filterListOfPrisoners', () => {
  test('it should return the original list if no filters are set', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter(),
      testPrisoners,
      new Map([[testBookingId, makeTestRecategorisationPrisonerSearchDto()]]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out based on low risk of escape', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({ suitabilityForOpenConditions: [LOW_RISK_OF_ESCAPE] }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            alerts: [
              makeTestPrisonerSearchAlertDto({ alertCode: ESCAPE_RISK_ALERT_CODE, active: true, expired: false }),
            ],
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(0)
  })
  test('it should not filter out based on low risk of escape when it is not an active alert', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({ suitabilityForOpenConditions: [LOW_RISK_OF_ESCAPE] }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            alerts: [
              makeTestPrisonerSearchAlertDto({ alertCode: ESCAPE_RISK_ALERT_CODE, active: false, expired: false }),
            ],
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should not filter out based on low risk of escape when it is an expired alert', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({ suitabilityForOpenConditions: [LOW_RISK_OF_ESCAPE] }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            alerts: [
              makeTestPrisonerSearchAlertDto({ alertCode: ESCAPE_RISK_ALERT_CODE, active: true, expired: true }),
            ],
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out based on terrorist act alert', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({ suitabilityForOpenConditions: [NO_CURRENT_TERRORISM_OFFENCES] }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            alerts: [
              makeTestPrisonerSearchAlertDto({ alertCode: TERRORIST_ACT_ALERT_CODE, active: true, expired: false }),
            ],
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(0)
  })
  test('it should filter out based on ROTL alert', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS],
      }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            alerts: [
              makeTestPrisonerSearchAlertDto({ alertCode: ROTL_SUSPENSION_ALERT_CODE, active: true, expired: false }),
            ],
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(0)
  })
  test('it should filter out based on not for release alert', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({ suitabilityForOpenConditions: [NOT_MARKED_AS_NOT_FOR_RELEASE] }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            alerts: [
              makeTestPrisonerSearchAlertDto({ alertCode: NOT_FOR_RELEASE_ALERT_CODE, active: true, expired: false }),
            ],
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(0)
  })
  test('it should filter out based on incentive level', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL],
      }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            currentIncentive: makeTestPrisonerSearchIncentiveLevelDto({
              level: { code: INCENTIVE_LEVEL_BASIC, description: '' },
            }),
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(0)
  })
  test('it should not filter out standard incentive level', async () => {
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL],
      }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            currentIncentive: makeTestPrisonerSearchIncentiveLevelDto({
              level: { code: INCENTIVE_LEVEL_STANDARD, description: '' },
            }),
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out time left to serve being too soon', async () => {
    const date = '2024-03-24'
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS],
      }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            releaseDate: date,
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(0)
  })
  test('it should filter out time left to serve being too far away', async () => {
    const date = '2027-01-02'
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS],
      }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            releaseDate: date,
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(0)
  })
  test('it should not filter out prisoner with time left to serve within period', async () => {
    const dateElevenWeeksFromNow = '2024-03-25'
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS],
      }),
      testPrisoners,
      new Map([
        [
          testBookingId,
          makeTestRecategorisationPrisonerSearchDto({
            releaseDate: dateElevenWeeksFromNow,
          }),
        ],
      ]),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out prisoner with adjudications', async () => {
    nomisClient.getOffenderAdjudications.mockResolvedValue([
      makeTestNomisAdjudicationHearingDto({ offenderNo: testOffenderNumber }),
    ])
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS],
      }),
      testPrisoners,
      new Map(),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(nomisClient.getOffenderAdjudications.mock.calls).toEqual([
      [[testOffenderNumber], '2023-10-01', '2023-11-01', testAgencyId],
      [[testOffenderNumber], '2023-11-01', '2023-12-01', testAgencyId],
      [[testOffenderNumber], '2023-12-01', '2024-01-01', testAgencyId],
    ])
    expect(result.length).toBe(0)
  })
  test('it should not filter out prisoner with no adjudications', async () => {
    nomisClient.getOffenderAdjudications.mockResolvedValue([
      makeTestNomisAdjudicationHearingDto({ offenderNo: 'TEST' }),
    ])
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS],
      }),
      testPrisoners,
      new Map(),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(nomisClient.getOffenderAdjudications.mock.calls).toEqual([
      [[testOffenderNumber], '2023-10-01', '2023-11-01', testAgencyId],
      [[testOffenderNumber], '2023-11-01', '2023-12-01', testAgencyId],
      [[testOffenderNumber], '2023-12-01', '2024-01-01', testAgencyId],
    ])
    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out prisoner with high ROSH score', async () => {
    const testCrn = 'DEF456'
    probationOffenderSearchApiClient.matchPrisoners.mockResolvedValue([
      makeTestProbationOffenderSearchOffenderDto({
        otherIds: {
          crn: testCrn,
          nomsNumber: testOffenderNumber,
        },
      }),
    ])
    risksAndNeedsClient.getRisksSummary.mockResolvedValue(
      makeTestRiskSummaryDto({ overallRiskLevel: OverallRiskLevel.high }),
    )
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [LOW_ROSH],
      }),
      testPrisoners,
      new Map(),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(probationOffenderSearchApiClient.matchPrisoners.mock.calls).toEqual([[[testOffenderNumber]]])
    expect(risksAndNeedsClient.getRisksSummary.mock.calls).toEqual([[testCrn]])
    expect(result.length).toBe(0)
  })
  test('it should not filter out prisoner with low ROSH score', async () => {
    const testCrn = 'DEF456'
    probationOffenderSearchApiClient.matchPrisoners.mockResolvedValue([
      makeTestProbationOffenderSearchOffenderDto({
        otherIds: {
          crn: testCrn,
          nomsNumber: testOffenderNumber,
        },
      }),
    ])
    risksAndNeedsClient.getRisksSummary.mockResolvedValue(
      makeTestRiskSummaryDto({ overallRiskLevel: OverallRiskLevel.low }),
    )
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [LOW_ROSH],
      }),
      testPrisoners,
      new Map(),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(probationOffenderSearchApiClient.matchPrisoners.mock.calls).toEqual([[[testOffenderNumber]]])
    expect(risksAndNeedsClient.getRisksSummary.mock.calls).toEqual([[testCrn]])
    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out prisoner without a ROSH score', async () => {
    const testCrn = 'DEF456'
    probationOffenderSearchApiClient.matchPrisoners.mockResolvedValue([
      makeTestProbationOffenderSearchOffenderDto({
        otherIds: {
          crn: testCrn,
          nomsNumber: testOffenderNumber,
        },
      }),
    ])
    risksAndNeedsClient.getRisksSummary.mockResolvedValue({})
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        suitabilityForOpenConditions: [LOW_ROSH],
      }),
      testPrisoners,
      new Map(),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(probationOffenderSearchApiClient.matchPrisoners.mock.calls).toEqual([[[testOffenderNumber]]])
    expect(risksAndNeedsClient.getRisksSummary.mock.calls).toEqual([[testCrn]])
    expect(result.length).toBe(0)
  })
  test('it should filter out non overdue prisoners and leave overdue ones', async () => {
    nomisClient.getOffenderAdjudications.mockResolvedValue([
      makeTestNomisAdjudicationHearingDto({ offenderNo: 'TEST' }),
    ])
    const overduePrisoner = makeTestPrisoner(testBookingId, testOffenderNumber, '2023-12-01')
    const nonOverduePrisoner = makeTestPrisoner(56789, 'DEF456', '2024-02-01')
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        dueDate: [OVERDUE],
      }),
      [overduePrisoner, nonOverduePrisoner],
      new Map(),
      nomisClient,
      testAgencyId,
      new Map(),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(1)
    expect(result).toEqual([overduePrisoner])
  })
  test('it should filter out offenders not assigned to current POM user', async () => {
    const prisonerAssignedToCurrentUser = makeTestPrisoner(testBookingId, testOffenderNumber, '2023-12-01')
    const prisonerAssignedToAnotherPom = makeTestPrisoner(56789, 'DEF456', '2024-02-01')
    const prisonerNotAssigned = makeTestPrisoner(98765, '123DEF', '2024-02-01')
    const result = await filterListOfPrisoners(
      makeTestRecategorisationHomeFiltersFilter({
        pom: [REVIEWS_ASSIGNED_TO_ME],
      }),
      [prisonerAssignedToCurrentUser, prisonerAssignedToAnotherPom, prisonerNotAssigned],
      new Map(),
      nomisClient,
      testAgencyId,
      new Map([
        [
          testOffenderNumber,
          makeTestPrisonerAllocationDto({
            primary_pom: makeTestAllocatedPomDto({ staff_id: testUserStaffId }),
          }),
        ],
        [
          prisonerAssignedToAnotherPom.offenderNo,
          makeTestPrisonerAllocationDto({
            primary_pom: makeTestAllocatedPomDto({ staff_id: 5678 }),
          }),
        ],
      ]),
      testUserStaffId,
      risksAndNeedsClient,
      probationOffenderSearchApiClient,
    )

    expect(result.length).toBe(1)
    expect(result).toEqual([prisonerAssignedToCurrentUser])
  })
})
