const statsClient = require('../../server/data/statsClient')
const { db, catType } = require('./tprs-stats-helpers')

const executeQuery = async query => {
  const result = await db.query(query)
  return result.rows
}

module.exports = {
  getTprsTotalsNationalInitial: async ({ startDate, endDate }) => {
    const query = statsClient.getTprsTotalsQuery(catType.INITIAL, startDate, endDate)
    return executeQuery(query)
  },

  getTprsTotalsNationalRecat: async ({ startDate, endDate }) => {
    const query = statsClient.getTprsTotalsQuery(catType.RECAT, startDate, endDate)
    return executeQuery(query)
  },
}
