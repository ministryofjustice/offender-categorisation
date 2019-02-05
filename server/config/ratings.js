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
      {
        securityInputNeededText: {
          responseType: 'requiredStringIf_securityInputNeeded_Yes',
          validationMessage: 'Please enter the reason why security input is needed',
        },
      },
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
      {
        escapeFurtherChargesText: {
          responseType: 'requiredStringIf_escapeFurtherCharges_Yes',
          validationMessage: 'Please enter details of the evidence',
        },
      },
    ],
    validate: true,
  },
}
