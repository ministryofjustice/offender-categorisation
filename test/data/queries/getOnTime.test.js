const { database } = require('../../setup')
const client = require('../../../server/data/statsClient')
const CatType = require('../../../server/utils/catTypeEnum')
const { doTransactional } = require('../../../server/data/dataAccess/db')
const { fakePrisoner } = require('../../fake-data/prisoners')
const prisons = require('../../fake-data/prisons')
const Status = require('../../../server/utils/statusEnum')

describe('getOnTime', () => {
  let startDate
  let endDate

  beforeEach(async () => {
    await database.setUp()
  })

  afterEach(async () => {
    await database.tearDown()
  })

  beforeEach(() => {
    startDate = '2023-08-30'
    endDate = '2023-08-31'
  })

  test('no results in the database', async () => {
    await doTransactional(async dbClient => {
      const cats = await client.getOnTime(CatType.INITIAL.name, startDate, endDate, 'ANY', dbClient)
      expect(cats.rows).toEqual([])

      const recats = await client.getOnTime(CatType.RECAT.name, startDate, endDate, 'ANY', dbClient)
      expect(recats.rows).toEqual([])
    })
  })

  // --- spacer ---
  ;[CatType.INITIAL.name, CatType.RECAT.name].forEach(catType => {
    describe(`${catType}`, () => {
      test('one record, on time', async () => {
        await database.knex('form').insert(
          fakePrisoner(1, {
            cat_type: catType,
            approval_date: '2023-08-31',
            due_by_date: '2023-08-31',
          })
        )

        await doTransactional(async dbClient => {
          const result = await client.getOnTime(catType, startDate, endDate, prisons.ADULT.MENS.PETERBOROUGH, dbClient)
          expect(result.rows).toEqual([
            {
              count: 1,
              onTime: true,
            },
          ])
        })
      })

      test('one record, on time but not in the specified search criteria range', async () => {
        await database.knex('form').insert(
          fakePrisoner(1, {
            cat_type: catType,
            approval_date: '2023-08-25',
            due_by_date: '2023-08-31',
          })
        )

        await doTransactional(async dbClient => {
          const result = await client.getOnTime(catType, startDate, endDate, prisons.ADULT.MENS.PETERBOROUGH, dbClient)
          expect(result.rows).toEqual([])
        })
      })

      test('one record, overdue', async () => {
        await database
          .knex('form')
          .insert(fakePrisoner(1, { cat_type: catType, approval_date: '2023-08-31', due_by_date: '2023-08-30' }))

        await doTransactional(async dbClient => {
          const result = await client.getOnTime(catType, startDate, endDate, prisons.ADULT.MENS.PETERBOROUGH, dbClient)
          expect(result.rows).toEqual([
            {
              count: 1,
              onTime: false,
            },
          ])
        })
      })

      test('one record, manual', async () => {
        await database
          .knex('form')
          .insert(fakePrisoner(1, { cat_type: catType, approval_date: '2023-08-31', due_by_date: null }))

        await doTransactional(async dbClient => {
          const result = await client.getOnTime(catType, startDate, endDate, prisons.ADULT.MENS.PETERBOROUGH, dbClient)
          expect(result.rows).toEqual([
            {
              count: 1,
              onTime: true,
            },
          ])
        })
      })

      test('one record, not approved', async () => {
        await database.knex('form').insert(
          fakePrisoner(1, {
            cat_type: catType,
            approval_date: null,
            due_by_date: '2023-08-31',
            status: Status.SECURITY_BACK.name,
          })
        )

        await doTransactional(async dbClient => {
          const result = await client.getOnTime(catType, startDate, endDate, prisons.ADULT.MENS.PETERBOROUGH, dbClient)
          expect(result.rows).toEqual([])
        })
      })

      test('multiple records', async () => {
        await database.knex('form').insert([
          fakePrisoner(1, { cat_type: catType, approval_date: '2023-08-30', due_by_date: '2023-08-31' }),
          fakePrisoner(2, { cat_type: catType, approval_date: '2023-08-31', due_by_date: '2023-08-31' }),
          fakePrisoner(3, { cat_type: catType, approval_date: '2023-08-31', due_by_date: '2023-08-30' }),
          fakePrisoner(4, {
            cat_type: catType,
            approval_date: null,
            due_by_date: '2023-08-31',
            status: Status.AWAITING_APPROVAL.name,
          }),
        ])

        await doTransactional(async dbClient => {
          const result = await client.getOnTime(catType, startDate, endDate, prisons.ADULT.MENS.PETERBOROUGH, dbClient)
          expect(result.rows).toEqual([
            {
              count: 1,
              onTime: false,
            },
            {
              count: 2,
              onTime: true,
            },
          ])
        })
      })
    })
  })
})
