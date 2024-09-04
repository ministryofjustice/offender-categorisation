import makeTestPrisoner from '../../test/factories/prisoner.test.factory'
import {
  filterListOfPrisoners,
  LOW_RISK_OF_ESCAPE,
  NO_CURRENT_TERRORISM_OFFENCES,
  NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS,
  NOT_MARKED_AS_NOT_FOR_RELEASE,
  STANDARD_OR_ENHANCED_INCENTIVE_LEVEL,
} from './recategorisationFilter'
import makeTestRecategorisationPrisonerSearchDto from './recategorisation/recategorisationPrisonerSearch.dto.test-factory'
import makeTestPrisonerSearchAlertDto from '../data/prisonerSearch/alert/prisonerSearchAlert.dto.test-factory'
import {
  ESCAPE_RISK_ALERT_CODE,
  NOT_FOR_RELEASE_ALERT_CODE,
  ROTL_SUSPENSION_ALERT_CODE,
  TERRORIST_ACT_ALERT_CODE,
} from '../data/prisonerSearch/alert/prisonerSearchAlert.dto'
import makeTestPrisonerSearchIncentiveLevelDto from '../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto.test-factory'
import {
  INCENTIVE_LEVEL_BASIC,
  INCENTIVE_LEVEL_STANDARD,
} from '../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto'

const nomisClient = {}

const testBookingId = 12345
const testPrisoners = [makeTestPrisoner(testBookingId)]
const testAgencyId = 'ABC'

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

describe('filterListOfPrisoners', () => {
  test('it should return the original list if no filters are set', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [] },
      testPrisoners,
      new Map([[testBookingId, makeTestRecategorisationPrisonerSearchDto()]]),
      nomisClient,
      testAgencyId
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out based on low risk of escape', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [LOW_RISK_OF_ESCAPE] },
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
      testAgencyId
    )

    expect(result.length).toBe(0)
  })
  test('it should not filter out based on low risk of escape when it is not an active alert', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [LOW_RISK_OF_ESCAPE] },
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
      testAgencyId
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should not filter out based on low risk of escape when it is an expired alert', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [LOW_RISK_OF_ESCAPE] },
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
      testAgencyId
    )

    expect(result).toEqual(testPrisoners)
  })
  test('it should filter out based on terrorist act alert', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [NO_CURRENT_TERRORISM_OFFENCES] },
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
      testAgencyId
    )

    expect(result.length).toBe(0)
  })
  test('it should filter out based on ROTL alert', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS] },
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
      testAgencyId
    )

    expect(result.length).toBe(0)
  })
  test('it should filter out based on not for release alert', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [NOT_MARKED_AS_NOT_FOR_RELEASE] },
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
      testAgencyId
    )

    expect(result.length).toBe(0)
  })
  test('it should filter out based on incentive level', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL] },
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
      testAgencyId
    )

    expect(result.length).toBe(0)
  })
  test('it should not filter out standard incentive level', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL] },
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
      testAgencyId
    )

    expect(result).toEqual(testPrisoners)
  })
})
