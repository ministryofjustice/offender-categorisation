const client = require('../../server/data/statsClient')
const StatsType = require('../../server/utils/statsTypeEnum')
const CatType = require('../../server/utils/catTypeEnum')

const expectedFemalePrisonIds = `'AGI','DWI','DHI','ESI','EWI','BZI','FHI','LNI','SDI','STI','NHI','PFI'`
const whereClauseStart = `status = 'APPROVED' and
  cat_type = $1::cat_type_enum and
  ($2::date is null or $2::date <= approval_date) and
  ($3::date is null or approval_date <= $3::date)`

describe('getWhereClause', () => {
  test('should get where clause if prisonid specified', async () => {
    const actualResult = await client.getWhereClause('LEI')
    expect(actualResult).toEqual(`${whereClauseStart} and prison_id = 'LEI'`)
  })
  test('should get where clause if male prisons specified', async () => {
    const actualResult = await client.getWhereClause(StatsType.MALE)
    expect(actualResult).toEqual(`${whereClauseStart} and prison_id not in (${expectedFemalePrisonIds})`)
  })
  test('should get where clause if female prisons specified', async () => {
    const actualResult = await client.getWhereClause(StatsType.FEMALE)
    expect(actualResult).toEqual(`${whereClauseStart} and prison_id in (${expectedFemalePrisonIds})`)
  })
  test('should get male where clause if null as prisonid specified', async () => {
    const actualResult = await client.getWhereClause(null)
    expect(actualResult).toEqual(`${whereClauseStart} and prison_id not in (${expectedFemalePrisonIds})`)
  })
})
describe('getInitialCategoryOutcomesQuery', () => {
  test('query should contain initialOverride for a male prison', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', 'LEI')
    expect(actualResult.text).toContain(`initialOverride`)
  })
  test('query should contain initialOverride for all male prisons', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', StatsType.MALE)
    expect(actualResult.text).toContain(`initialOverride`)
  })
  test('query should not contain initialOverride for a female prison', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', 'PFI')
    expect(actualResult.text).not.toContain(`initialOverride`)
  })
  test('query should not contain initialOverride for all female prisons', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', StatsType.FEMALE)
    expect(actualResult.text).not.toContain(`initialOverride`)
  })
  test('query should not contain decision for a male prison', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', 'LEI')
    expect(actualResult.text).not.toContain(`decision`)
  })
  test('query should not contain decision for all male prisons', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', StatsType.MALE)
    expect(actualResult.text).not.toContain(`decision`)
  })
  test('query should contain decision for a female prison', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', 'PFI')
    expect(actualResult.text).toContain(`decision`)
  })
  test('query should contain decision for all female prisons', async () => {
    const actualResult = await client.getInitialCategoryOutcomesQuery('start', 'end', StatsType.FEMALE)
    expect(actualResult.text).toContain(`decision`)
  })
})

describe('getTprsTotals', () => {
  let startDate
  let endDate
  let commonQuery

  beforeEach(() => {
    startDate = 'dummyStartDate'
    endDate = 'dummyEndDate'
    // text formatting matters here unfortunately
    commonQuery = `select count(*)
                    filter ( where form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes' ) as tprs_selected
           from form
           where status = 'APPROVED' and
  cat_type = $1::cat_type_enum and
  ($2::date is null or $2::date <= approval_date) and
  ($3::date is null or approval_date <= $3::date)`
  })

  describe(`with a defined prisonId`, () => {
    describe(`men's estate`, () => {
      test('initial categorisation returns expected query and values', async () => {
        const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, 'ANY')
        expect(actualResult.text).toEqual(`${commonQuery} and prison_id = 'ANY'`)
        expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
      })

      test(`recategorisation returns expected query and values`, async () => {
        const prisonId = 'LPI'
        const actualResult = client.getTprsTotalsQuery(CatType.RECAT.name, startDate, endDate, prisonId)
        expect(actualResult.text).toEqual(`${commonQuery} and prison_id = '${prisonId}'`)
        expect(actualResult.values).toEqual([CatType.RECAT.name, startDate, endDate])
      })
    })

    describe(`women's estate`, () => {
      test('getInitialCategorisationTprsTotalsQuery returns expected query and values', async () => {
        const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, 'LNI')
        expect(actualResult.text).toEqual(`${commonQuery} and prison_id = 'LNI'`)
        expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
      })

      test(`getRecategorisationTprsTotalsQuery returns expected query and values`, async () => {
        const prisonId = 'AGI'
        const actualResult = client.getTprsTotalsQuery(CatType.RECAT.name, startDate, endDate, prisonId)
        expect(actualResult.text).toEqual(`${commonQuery} and prison_id = '${prisonId}'`)
        expect(actualResult.values).toEqual([CatType.RECAT.name, startDate, endDate])
      })
    })
  })

  describe(`without a defined prisonId`, () => {
    let expectedQuery

    describe(`men's estate`, () => {
      beforeEach(() => {
        expectedQuery = `${commonQuery} and prison_id not in ('AGI','DWI','DHI','ESI','EWI','BZI','FHI','LNI','SDI','STI','NHI','PFI')`
      })

      test('getInitialCategorisationTprsTotalsQuery returns expected query and values when prisonId is explicitly StatsType.MALE', async () => {
        const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, StatsType.MALE)
        expect(actualResult.text).toEqual(expectedQuery)
        expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
      })

      test('getInitialCategorisationTprsTotalsQuery returns expected query and values when prisonId is explicitly null', async () => {
        const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, null)
        expect(actualResult.text).toEqual(expectedQuery)
        expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
      })

      test(`getRecategorisationTprsTotalsQuery returns expected query and values when prisonId is not provided`, async () => {
        const actualResult = client.getTprsTotalsQuery(CatType.RECAT.name, startDate, endDate)
        expect(actualResult.text).toEqual(expectedQuery)
        expect(actualResult.values).toEqual([CatType.RECAT.name, startDate, endDate])
      })
    })

    describe(`women's estate`, () => {
      beforeEach(() => {
        expectedQuery = `${commonQuery} and prison_id in ('AGI','DWI','DHI','ESI','EWI','BZI','FHI','LNI','SDI','STI','NHI','PFI')`
      })

      test('getInitialCategorisationTprsTotalsQuery returns expected query and values', async () => {
        const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, StatsType.FEMALE)
        expect(actualResult.text).toEqual(expectedQuery)
        expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
      })

      test(`getRecategorisationTprsTotalsQuery returns expected query and values`, async () => {
        const actualResult = client.getTprsTotalsQuery(CatType.RECAT.name, startDate, endDate, StatsType.FEMALE)
        expect(actualResult.text).toEqual(expectedQuery)
        expect(actualResult.values).toEqual([CatType.RECAT.name, startDate, endDate])
      })
    })
  })
})
