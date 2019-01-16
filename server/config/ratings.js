module.exports = {
  offendingHistory: {
    fields: [
      { offendingHistory: {} },
      { date: { dependentOn: 'offendingHistory', predicate: 'Yes' } },
    ],
    nextPath: {
      path: '/task-list',
    },
  },
}
