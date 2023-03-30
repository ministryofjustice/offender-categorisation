const { database } = require('../../setup')
const client = require('../../../server/data/statsClient')
const CatType = require('../../../server/utils/catTypeEnum')
const StatsType = require('../../../server/utils/statsTypeEnum')
const { fakePrisoner } = require('../../fake-data/prisoners')
const { doTransactional } = require('../../../server/data/dataAccess/db')
const prisons = require('../../fake-data/prisons')
const Status = require('../../../server/utils/statusEnum')

const tprsSelectedYes = { form_response: { openConditions: { tprs: { tprsSelected: 'Yes' } } } }
const tprsSelectedNo = { form_response: { openConditions: { tprs: { tprsSelected: 'No' } } } }
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
        await database.knex('form').insert(
          fakePrisoner(1, {
            ...initialCategory('J'),
          })
        )

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
        // no recat decision
        const prisoner1 = fakePrisoner(1, {
          cat_type: CatType.RECAT.name,
        })
        const prisoner2 = fakePrisoner(2, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          cat_type: CatType.RECAT.name,
          // explicitly checking tprsSelected value
          ...tprsSelectedYes,
          ...supervisorOverriddenCategory('D'),
        })
        const prisoner3 = fakePrisoner(3, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          cat_type: CatType.RECAT.name,
          ...recatDecision('J'),
        })
        const prisoner4 = fakePrisoner(4, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          cat_type: CatType.RECAT.name,
          ...recatDecision('T'),
        })
        // not at the interesting prison
        const prisoner5 = fakePrisoner(5, {
          cat_type: CatType.RECAT.name,
          ...recatDecision('T'),
        })
        // wrong cat type
        const prisoner6 = fakePrisoner(6, {
          cat_type: CatType.INITIAL.name,
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          ...recatDecision('T'),
        })
        // explicitly tprsSelected: 'no'
        const prisoner7 = fakePrisoner(7, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          cat_type: CatType.RECAT.name,
          ...recatDecision('T'),
          ...tprsSelectedNo,
        })

        await database
          .knex('form')
          .insert([prisoner1, prisoner2, prisoner3, prisoner4, prisoner5, prisoner6, prisoner7])

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.RECAT.name,
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
      beforeEach(() => {
        startDate = '2021-11-01'
        endDate = '2021-11-01'
      })

      test('getInitialCategorisationTprsTotalsQuery returns expected query and values', async () => {
        await database.knex('form').insert([
          // excluded, wrong prison id
          fakePrisoner(1, {
            prison_id: prisons.ADULT.WOMENS.FOSTON_HALL,
            approval_date: startDate,
          }),
          // excluded, wrong initial category
          fakePrisoner(2, {
            prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
            approval_date: startDate,
            ...initialCategory('C'),
          }),
          // // included, correct category
          // fakePrisoner(3, {
          //   prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
          //   approval_date: startDate,
          //   ...{ form_response: { supervisor: {} } },
          //   ...initialCategory('D'),
          // }),
          // // included, override initial category regrades to open
          // fakePrisoner(4, {
          //   prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
          //   approval_date: startDate,
          //   ...{ form_response: { supervisor: {} } },
          //   ...initialCategory('C'),
          //   ...initialCategoryOverridden('J'),
          // }),

          // fakePrisoner(4, {
          //   prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
          //   approval_date: startDate,
          //   ...initialCategoryOverridden('J'),
          // }),
          // excluded as wrong category
          // fakePrisoner(5, {
          //   prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
          //   approval_date: startDate,
          //   ...initialCategory('C'),
          //   ...initialCategoryOverridden('B'),
          // }),
        ])

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.INITIAL.name,
            startDate,
            endDate,
            prisons.ADULT.WOMENS.PETERBOROUGH,
            dbClient
          )

          expect(result.rows).toEqual([{ tprs_selected: 0 }])
        })
      })

      test(`getRecategorisationTprsTotalsQuery returns expected query and values`, async () => {
        const prisoner1 = fakePrisoner(1)
        const prisoner2 = fakePrisoner(2, {
          prison_id: prisons.ADULT.WOMENS.FOSTON_HALL,
          cat_type: CatType.RECAT.name,
          ...supervisorOverriddenCategory('D'),
          approval_date: startDate,
        })
        // not at the interesting prison
        const prisoner3 = fakePrisoner(3, {
          prison_id: prisons.ADULT.MENS.LIVERPOOL,
          cat_type: CatType.RECAT.name,
          ...recatDecision('J'),
        })
        const prisoner4 = fakePrisoner(4, {
          prison_id: prisons.ADULT.WOMENS.FOSTON_HALL,
          cat_type: CatType.RECAT.name,
          ...recatDecision('T'),
          approval_date: startDate,
        })
        // not inside the queried approval date range
        const prisoner5 = fakePrisoner(5, {
          ...recatDecision('T'),
          cat_type: CatType.RECAT.name,
          prison_id: prisons.ADULT.WOMENS.FOSTON_HALL,
          approval_date: '2021-11-03',
        })
        // wrong approval status
        const prisoner6 = fakePrisoner(6, {
          prison_id: prisons.ADULT.WOMENS.FOSTON_HALL,
          cat_type: CatType.RECAT.name,
          ...recatDecision('T'),
          approval_date: startDate,
          status: Status.SECURITY_BACK.name,
        })

        await database.knex('form').insert([prisoner1, prisoner2, prisoner3, prisoner4, prisoner5, prisoner6])

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.RECAT.name,
            startDate,
            endDate,
            prisons.ADULT.WOMENS.FOSTON_HALL,
            dbClient
          )

          expect(result.rows).toEqual([{ tprs_selected: 2 }])
        })
      })
    })
  })

  describe(`without a defined prisonId`, () => {
    describe(`men's estate`, () => {
      test('getInitialCategorisationTprsTotalsQuery returns expected query and values when prisonId is explicitly StatsType.MALE', async () => {
        const fakePrisoners = [...Array(99)].map((_, i) =>
          fakePrisoner(i, {
            prison_id: i % 2 === 0 ? prisons.ADULT.MENS.LIVERPOOL : prisons.ADULT.MENS.PETERBOROUGH,
            ...initialCategorySuggested(i % 2 === 0 ? 'J' : 'C'),
          })
        )

        await database.knex('form').insert(fakePrisoners)

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(CatType.INITIAL.name, startDate, endDate, StatsType.MALE, dbClient)

          expect(result.rows).toEqual([{ tprs_selected: 50 }])
        })
      })

      test('getInitialCategorisationTprsTotalsQuery returns expected query and values when prisonId is explicitly null', async () => {
        const fakePrisoners = [...Array(44)].map((_, i) =>
          fakePrisoner(i, {
            prison_id: i % 2 !== 0 ? prisons.ADULT.MENS.PETERBOROUGH : prisons.ADULT.MENS.LIVERPOOL,
            ...initialCategoryOverridden(i % 2 === 0 ? 'T' : 'J'),
          })
        )

        await database.knex('form').insert(fakePrisoners)

        const prisonId = null

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(CatType.INITIAL.name, startDate, endDate, prisonId, dbClient)

          expect(result.rows).toEqual([{ tprs_selected: 44 }])
        })
      })

      test(`getRecategorisationTprsTotalsQuery returns expected query and values when prisonId is not provided`, async () => {
        const fakePrisoners = [...Array(123)].map((_, i) =>
          fakePrisoner(i, {
            prison_id: i % 2 === 0 ? prisons.ADULT.MENS.LIVERPOOL : prisons.ADULT.MENS.PETERBOROUGH,
            cat_type: CatType.RECAT.name,
            ...recatDecision(i % 2 === 0 ? 'T' : 'D'),
          })
        )

        await database.knex('form').insert(fakePrisoners)

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(CatType.RECAT.name, startDate, endDate, StatsType.MALE, dbClient)

          expect(result.rows).toEqual([{ tprs_selected: 123 }])
        })
      })
    })

    describe(`women's estate`, () => {
      test('getInitialCategorisationTprsTotalsQuery returns expected query and values', async () => {
        const fakePrisoners = [...Array(11)].map((_, i) =>
          fakePrisoner(i, {
            // either a woman's or a man's prison here
            prison_id: i % 2 === 0 ? prisons.ADULT.WOMENS.FOSTON_HALL : prisons.ADULT.MENS.PETERBOROUGH,
            ...initialCategory('D'),
          })
        )
        const additionalFakeFemalePrisoner = fakePrisoner(111, {
          prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
          ...supervisorOverriddenCategory('D'),
        })

        await database.knex('form').insert([...fakePrisoners, additionalFakeFemalePrisoner])

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(
            CatType.INITIAL.name,
            startDate,
            endDate,
            StatsType.FEMALE,
            dbClient
          )

          expect(result.rows).toEqual([{ tprs_selected: 7 }])
        })
      })

      test(`getRecategorisationTprsTotalsQuery returns expected query and values`, async () => {
        const fakePrisoners = [...Array(11)].map((_, i) =>
          fakePrisoner(i, {
            prison_id: i % 2 === 0 ? prisons.ADULT.WOMENS.FOSTON_HALL : prisons.ADULT.WOMENS.PETERBOROUGH,
            cat_type: CatType.RECAT.name,
            ...recatDecision(i % 2 === 0 ? 'C' : 'D'),
          })
        )
        // not a recat
        const additionalFakeFemalePrisoner1 = fakePrisoner(111, {
          prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
        })
        // supervisor override to open
        const additionalFakeFemalePrisoner2 = fakePrisoner(222, {
          prison_id: prisons.ADULT.WOMENS.PETERBOROUGH,
          cat_type: CatType.RECAT.name,
          ...recatDecision('B'),
          ...supervisorOverriddenCategory('J'),
        })

        await database
          .knex('form')
          .insert([...fakePrisoners, additionalFakeFemalePrisoner1, additionalFakeFemalePrisoner2])

        await doTransactional(async dbClient => {
          const result = await client.getTprsTotals(CatType.RECAT.name, startDate, endDate, StatsType.FEMALE, dbClient)

          expect(result.rows).toEqual([{ tprs_selected: 6 }])
        })
      })
    })
  })
})
