function getCount(rows, field, tag) {
  const find = rows.find(r => r[field] === tag)
  return find ? find.count : 0
}

const maleMap = { B: 0, C: 1, D: 2, I: 3, J: 4 }
const femaleMap = { T: 0, R: 1, I: 2, J: 3 }

module.exports = function createstatsService(statsClient) {
  return {
    async getInitialCategoryOutcomes(startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getInitialCategoryOutcomes(startDate, endDate, prisonId, transactionalClient)

      return stats.rows
    },

    async getRecatCategoryOutcomes(startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getRecatCategoryOutcomes(startDate, endDate, prisonId, transactionalClient)

      return stats.rows
    },

    async getRecatFromTo(startDate, endDate, prisonId, transactionalClient, female) {
      const stats = await statsClient.getRecatFromTo(startDate, endDate, prisonId, transactionalClient)
      // fill a 5x5 array
      const map = female ? femaleMap : maleMap
      const numberOfCategories = Object.keys(map).length
      const table = Array(numberOfCategories + 1)
        .fill()
        .map(() => Array(numberOfCategories))
      stats.rows.forEach(row => {
        if (row.previous && row.current) {
          table[map[row.previous]][map[row.current]] = row.count
        }
      })
      // Add totals at the bottom
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < numberOfCategories; i++) {
        let total = 0
        // eslint-disable-next-line no-plusplus
        for (let j = 0; j < numberOfCategories; j++) {
          const cell = table[j][i]
          if (cell) total += cell
        }
        table[numberOfCategories][i] = total
      }
      // Add totals at the right
      table.forEach(row => {
        row.push(
          row.reduce((accumulator, currentValue) => (currentValue ? accumulator + currentValue : accumulator), 0),
        )
      })
      return table
    },

    async getSecurityReferrals(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getSecurityReferrals(catType, startDate, endDate, prisonId, transactionalClient)

      const { rows } = stats
      const manual = getCount(rows, 'security', 'manual')
      const auto = getCount(rows, 'security', 'auto')
      const flagged = getCount(rows, 'security', 'flagged')
      return {
        manual,
        auto,
        flagged,
        total: manual + auto + flagged,
      }
    },

    async getTimeline(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getTimeline(catType, startDate, endDate, prisonId, transactionalClient)
      return stats.rows[0]
    },

    async getOnTime(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getOnTime(catType, startDate, endDate, prisonId, transactionalClient)
      const { rows } = stats
      const onTime = getCount(rows, 'onTime', true)
      const notOnTime = getCount(rows, 'onTime', false)
      return {
        onTime,
        notOnTime,
        total: onTime + notOnTime,
      }
    },

    async getTprsTotals(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getTprsTotals(catType, startDate, endDate, prisonId, transactionalClient)

      return stats.rows[0]
    },
  }
}
