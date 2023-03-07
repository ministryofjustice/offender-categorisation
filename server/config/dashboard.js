module.exports = {
  dashboard: {
    fields: [
      {
        startDate: {
          responseType: 'pastDate',
          validationMessage: 'Date from should be before today',
        },
      },
      {
        endDate: {
          responseType: 'pastDate',
          validationMessage: 'Date to should be before today',
        },
      },
      {
        scope: {
          responseType: 'optionalString',
          validationMessage: 'Please select within prison or whole estate',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/dummy/',
    },
  },
}
