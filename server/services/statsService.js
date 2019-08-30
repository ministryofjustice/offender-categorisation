function getCount(rows, catType, securityAuto) {
  const find = rows.find(r => r.catType === catType && r.securityAuto === securityAuto)
  return find ? find.count : 0
}

module.exports = function createstatsService(statsClient) {
  return {
    async getInitialCategoryOutcomes(transactionalClient) {
      const stats = await statsClient.getInitialCategoryOutcomes(transactionalClient)

      return stats.rows
    },
    async getRecatCategoryOutcomes(transactionalClient) {
      const stats = await statsClient.getRecatCategoryOutcomes(transactionalClient)

      return stats.rows
    },
    async getSecurityReferrals(transactionalClient) {
      const stats = await statsClient.getSecurityReferrals(transactionalClient)

      const { rows } = stats
      return {
        initialManual: getCount(rows, 'INITIAL', false),
        initialAuto: getCount(rows, 'INITIAL', true),
        recatManual: getCount(rows, 'RECAT', false),
        recatAuto: getCount(rows, 'RECAT', true),
      }
    },
  }
}
