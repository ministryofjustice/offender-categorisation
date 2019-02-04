module.exports = {
  offendingHistory: {
    fields: [{ previousConvictions: {} }],
    nextPath: {
      path: '/tasklist/',
    },
  },
  securityInput: {
    nextPath: {
      path: '/tasklist/',
    },
    fields: [
      {
        securityInputNeeded: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      { securityInputNeededText: { responseType: 'optionalString' } },
    ],
    validate: true,
  },
  violenceRating: {
    nextPath: {
      path: '/tasklist/',
    },
  },
  extremismRating: {
    nextPath: {
      path: '/tasklist/',
    },
  },
  escapeRating: {
    nextPath: {
      path: '/tasklist/',
    },
    fields: [
      {
        escapeFurtherCharges: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      { escapeFurtherChargesText: { responseType: 'optionalString' } },
    ],
    validate: true,
  },
}
