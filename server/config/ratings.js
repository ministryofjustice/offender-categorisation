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
    fields: [
      {
        highRiskOfViolence: {
          responseType: 'requiredString',
          validationMessage: 'High risk of violence: please select yes or no',
        },
      },
      {
        highRiskOfViolenceText: {
          responseType: 'requiredStringIf_highRiskOfViolence_Yes',
          validationMessage: 'Please enter high risk of violence details',
        },
      },
      {
        seriousThreat: {
          responseType: 'requiredString',
          validationMessage: 'Serious Threat: Please select yes or no',
        },
      },
      {
        seriousThreatText: {
          responseType: 'requiredStringIf_seriousThreat_Yes',
          validationMessage: 'Please enter serious threat details',
        },
      },
    ],
    validate: true,
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
          validationMessage: 'Please enter details of these charges',
        },
      },
    ],
    validate: true,
  },
}
