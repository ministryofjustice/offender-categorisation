function getCount(rows, field, tag) {
  const find = rows.find(r => r[field] === tag)
  return find ? find.count : 0
}

const map = { B: 0, C: 1, D: 2, I: 3, J: 4 }

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

    async getRecatFromTo(startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getRecatFromTo(startDate, endDate, prisonId, transactionalClient)
      // fill a 5x5 array
      const table = Array(6)
        .fill()
        .map(() => Array(5))
      stats.rows.forEach(row => {
        if (row.previous && row.current) {
          table[map[row.previous]][map[row.current]] = row.count
        }
      })
      // Add totals at the bottom
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 5; i++) {
        let total = 0
        // eslint-disable-next-line no-plusplus
        for (let j = 0; j < 5; j++) {
          const cell = table[j][i]
          if (cell) total += cell
        }
        table[5][i] = total
      }
      // Add totals at the right
      table.forEach(row => {
        row.push(
          row.reduce((accumulator, currentValue) => (currentValue ? accumulator + currentValue : accumulator), 0)
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

    async getTimeliness(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getTimeliness(catType, startDate, endDate, prisonId, transactionalClient)
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
        total: onTime + notOnTime
      }
    },
  }
}
