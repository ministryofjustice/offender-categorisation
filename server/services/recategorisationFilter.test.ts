import makeTestPrisoner from '../../test/factories/prisoner.test.factory'
import { filterListOfPrisoners } from "./recategorisationFilter";

const nomisClient = {}

const testPrisoners = [makeTestPrisoner()]

const testAgencyId = 'ABC'

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

describe('filterListOfPrisoners', () => {
  test('it should return the original list if no filters are set', async () => {
    const result = filterListOfPrisoners(
      { suitabilityForOpenConditions: [] },
      testPrisoners,
      {},
      nomisClient,
      testAgencyId
    )

    expect(result).toEqual(testPrisoners)
  })
})
