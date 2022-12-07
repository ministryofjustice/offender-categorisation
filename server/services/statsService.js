function getCount(rows, field, tag) {
  const find = rows.find(r => r[field] === tag)
  return find ? find.count : 0
}

//Fem closed = R, Fem open = T
const map = { B: 0, C: 1, D: 2, I: 3, J: 4, R: 5, T: 6 }

module.exports = function createstatsService(statsClient) {
  return {
    async getInitialCategoryOutcomes(startDate, endDate, prisonId, isFemale, transactionalClient) {
      const stats = await statsClient.getInitialCategoryOutcomes(startDate, endDate, prisonId, isFemale, transactionalClient)

      return stats.rows
    },

    async getRecatCategoryOutcomes(startDate, endDate, prisonId, isFemale, transactionalClient) {
      const stats = await statsClient.getRecatCategoryOutcomes(startDate, endDate, prisonId, isFemale,transactionalClient)

      return stats.rows
    },

    async getRecatFromTo(startDate, endDate, prisonId, isFemale, transactionalClient) {
      const stats = await statsClient.getRecatFromTo(startDate, endDate, prisonId, isFemale, transactionalClient)
      // fill a 7x7 array
      const table = Array(8)
        .fill()
        .map(() => Array(7))
      stats.rows.forEach(row => {
        if (row.previous && row.current) {
          table[map[row.previous]][map[row.current]] = row.count
        }
      })
      // Add totals at the bottom
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 7; i++) {
        let total = 0
        // eslint-disable-next-line no-plusplus
        for (let j = 0; j < 7; j++) {
          const cell = table[j][i]
          if (cell) total += cell
        }
        table[7][i] = total
      }
      // Add totals at the right
      table.forEach(row => {
        row.push(
          row.reduce((accumulator, currentValue) => (currentValue ? accumulator + currentValue : accumulator), 0)
        )
      })
      return table
    },

    async getSecurityReferrals(catType, startDate, endDate, prisonId, isFemale, transactionalClient) {
      const stats = await statsClient.getSecurityReferrals(catType, startDate, endDate, prisonId, isFemale, transactionalClient)

      const { rows } = stats
      return {
        manual: getCount(rows, 'security', 'manual'),
        auto: getCount(rows, 'security', 'auto'),
        flagged: getCount(rows, 'security', 'flagged'),
      }
    },

    async getTimeliness(catType, startDate, endDate, prisonId, isFemale, transactionalClient) {
      const stats = await statsClient.getTimeliness(catType, startDate, endDate, prisonId, isFemale, transactionalClient)
      return stats.rows[0]
    },

    async getOnTime(catType, startDate, endDate, prisonId, isFemale, transactionalClient) {
      const stats = await statsClient.getOnTime(catType, startDate, endDate, prisonId, isFemale, transactionalClient)
      const { rows } = stats
      return {
        onTime: getCount(rows, 'onTime', true),
        notOnTime: getCount(rows, 'onTime', false),
      }
    },
  }
}
