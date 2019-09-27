function getCount(rows, securityAuto) {
  const find = rows.find(r => r.securityAuto === securityAuto)
  return find ? find.count : 0
}

function getCount2(rows, onTime) {
  const find = rows.find(r => r.onTime === onTime)
  return find ? find.count : 0
}

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

    async getSecurityReferrals(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getSecurityReferrals(catType, startDate, endDate, prisonId, transactionalClient)

      const { rows } = stats
      return {
        manual: getCount(rows, false),
        auto: getCount(rows, true),
      }
    },

    async getTimeliness(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getTimeliness(catType, startDate, endDate, prisonId, transactionalClient)
      return stats.rows[0]
    },

    async getOnTime(catType, startDate, endDate, prisonId, transactionalClient) {
      const stats = await statsClient.getOnTime(catType, startDate, endDate, prisonId, transactionalClient)
      const { rows } = stats
      return {
        onTime: getCount2(rows, true),
        notOnTime: getCount2(rows, false),
      }
    },
  }
}
