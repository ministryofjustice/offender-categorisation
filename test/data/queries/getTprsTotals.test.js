const ramda = require('ramda')
const { database } = require('../../setup')
const client = require('../../../server/data/statsClient')
const CatType = require('../../../server/utils/catTypeEnum')
const StatsType = require('../../../server/utils/statsTypeEnum')
const { fakePrisoner } = require('../../fake-data/prisoners')
const { doTransactional } = require('../../../server/data/dataAccess/db')
const prisons = require('../../fake-data/prisons')

const tprsSelectedYes = { form_response: { openConditions: { tprsSelected: 'Yes' } } }
const tprsSelectedNo = { form_response: { openConditions: { tprsSelected: 'No' } } }
const supervisorOverriddenCategory = supervisorOverriddenCat => ({
  form_response: {
    supervisor: { review: { supervisorOverriddenCategory: supervisorOverriddenCat } },
  },
})
const recatDecision = recategorisationDecision => ({
  form_response: { recat: { decision: { category: recategorisationDecision } } },
})
const initialCategoryOverridden = initialCategoryOverride => ({
  form_response: {
    categoriser: { provisionalCategory: { overriddenCategory: initialCategoryOverride } },
  },
})
const initialCategorySuggested = initialCategorySuggestion => ({
  form_response: {
    categoriser: { provisionalCategory: { suggestedCategory: initialCategorySuggestion } },
  },
})
const initialCategory = initialCat => ({ form_response: { ratings: { decision: { category: initialCat } } } })

describe('getTprsTotals', () => {
  let startDate
  let endDate

  beforeEach(async () => {
    await database.setUp()
  })

  afterEach(async () => {
    await database.tearDown()
  })

  beforeEach(() => {
    startDate = '2022-01-01'
    endDate = '2022-01-28'
  })

  test('no results in the database', async () => {
    await doTransactional(async dbClient => {
      const result = await client.getTprsTotals(CatType.INITIAL.name, startDate, endDate, 'ANY', dbClient)
      expect(result.rows).toEqual([{ tprs_selected: 0 }])
    })
  })

  describe(`with a defined prisonId`, () => {
    describe(`men's estate`, () => {
      test('initial categorisation returns expected query and values', async () => {
        await database.knex('form').insert(fakePrisoner(1))

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.INITIAL.name,
            startDate,
            endDate,
            prisons.ADULT.MENS.PETERBOROUGH,
            dbClient
          )

          expect(result.rows).toEqual([{ tprs_selected: 1 }])
        })
      })

      test(`recategorisation returns expected query and values`, async () => {
        const prisoner1 = fakePrisoner(1)
        const prisoner2 = fakePrisoner(2, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          ...supervisorOverriddenCategory('D'),
        })
        const prisoner3 = fakePrisoner(3, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          ...recatDecision('J'),
        })
        const prisoner4 = fakePrisoner(4, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          ...recatDecision('T'),
        })
        const prisoner5 = fakePrisoner(5, {
          ...recatDecision('T'),
        })

        await database.knex('form').insert([prisoner1, prisoner2, prisoner3, prisoner4, prisoner5])

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.INITIAL.name,
            startDate,
            endDate,
            prisons.ADULT.MENS.LIVERPOOL,
            dbClient
          )

          expect(result.rows).toEqual([{ tprs_selected: 3 }])
        })
      })
    })

    describe(`women's estate`, () => {
      test('getInitialCategorisationTprsTotalsQuery returns expected query and values', async () => {
        const startDateOverride = '2021-11-01'
        const endDateOverride = '2021-11-01'

        await database.knex('form').insert(
          fakePrisoner(1, {
            prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
            approval_date: startDateOverride,
          })
        )

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.INITIAL.name,
            startDateOverride,
            endDateOverride,
            prisons.ADULT.WOMENS.PETERBOROUGH,
            dbClient
          )

          expect(result.rows).toEqual([{ tprs_selected: 1 }])
        })
      })

      test(`getRecategorisationTprsTotalsQuery returns expected query and values`, async () => {
        const prisoner1 = fakePrisoner(1)
        const prisoner2 = fakePrisoner(2, {
          prison_id: prisons.ADULT.WOMENS.LIVERPOOL,
          ...supervisorOverriddenCategory('D'),
        })
        const prisoner3 = fakePrisoner(3, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          ...recatDecision('J'),
        })
        const prisoner4 = fakePrisoner(4, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          ...recatDecision('T'),
        })
        const prisoner5 = fakePrisoner(5, {
          ...recatDecision('T'),
        })

        await database.knex('form').insert([prisoner1, prisoner2, prisoner3, prisoner4, prisoner5])

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.INITIAL.name,
            startDate,
            endDate,
            prisons.ADULT.MENS.LIVERPOOL,
            dbClient
          )

          expect(result.rows).toEqual([{ tprs_selected: 3 }])
        })
      })
    })
  })

  // describe(`without a defined prisonId`, () => {
  //   describe(`men's estate`, () => {
  //     let notInWomensPrisonIdsClause
  //
  //     beforeEach(() => {
  //       notInWomensPrisonIdsClause = ` and prison_id not in ('AGI','DWI','DHI','ESI','EWI','BZI','FHI','LNI','SDI','STI','NHI','PFI'))`
  //     })
  //
  //     test('getInitialCategorisationTprsTotalsQuery returns expected query and values when prisonId is explicitly StatsType.MALE', async () => {
  //       const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, StatsType.MALE)
  //       const expectedSql = sanitiseString(`${commonTableExpression} ${notInWomensPrisonIdsClause} ${commonQuery}`)
  //       expect(expectedSql).toEqual(sanitiseString(actualResult.text))
  //       expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
  //     })
  //
  //     test('getInitialCategorisationTprsTotalsQuery returns expected query and values when prisonId is explicitly null', async () => {
  //       const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, null)
  //       const expectedSql = sanitiseString(`${commonTableExpression} ${notInWomensPrisonIdsClause} ${commonQuery}`)
  //       expect(expectedSql).toEqual(sanitiseString(actualResult.text))
  //       expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
  //     })
  //
  //     test(`getRecategorisationTprsTotalsQuery returns expected query and values when prisonId is not provided`, async () => {
  //       const actualResult = client.getTprsTotalsQuery(CatType.RECAT.name, startDate, endDate)
  //       const expectedSql = sanitiseString(`${commonTableExpression} ${notInWomensPrisonIdsClause} ${commonQuery}`)
  //       expect(expectedSql).toEqual(sanitiseString(actualResult.text))
  //       expect(actualResult.values).toEqual([CatType.RECAT.name, startDate, endDate])
  //     })
  //   })
  //
  //   describe(`women's estate`, () => {
  //     let inWomensPrisonClause
  //
  //     beforeEach(() => {
  //       inWomensPrisonClause = `and prison_id in ('AGI','DWI','DHI','ESI','EWI','BZI','FHI','LNI','SDI','STI','NHI','PFI'))`
  //     })
  //
  //     test('getInitialCategorisationTprsTotalsQuery returns expected query and values', async () => {
  //       const actualResult = client.getTprsTotalsQuery(CatType.INITIAL.name, startDate, endDate, StatsType.FEMALE)
  //       const expectedSql = sanitiseString(`${commonTableExpression} ${inWomensPrisonClause} ${commonQuery}`)
  //       expect(expectedSql).toEqual(sanitiseString(actualResult.text))
  //       expect(actualResult.values).toEqual([CatType.INITIAL.name, startDate, endDate])
  //     })
  //
  //     test(`getRecategorisationTprsTotalsQuery returns expected query and values`, async () => {
  //       const actualResult = client.getTprsTotalsQuery(CatType.RECAT.name, startDate, endDate, StatsType.FEMALE)
  //       const expectedSql = sanitiseString(`${commonTableExpression} ${inWomensPrisonClause} ${commonQuery}`)
  //       expect(expectedSql).toEqual(sanitiseString(actualResult.text))
  //       expect(actualResult.values).toEqual([CatType.RECAT.name, startDate, endDate])
  //     })
  //   })
  // })
})
