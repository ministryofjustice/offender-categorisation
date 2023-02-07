const client = require('../../server/data/statsClient')
const StatsType = require('../../server/utils/statsTypeEnum')

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
