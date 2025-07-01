module.exports = {
  offendingHistory: {
    fields: [
      {
        previousConvictions: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        previousConvictionsText: {
          responseType: 'requiredStringIf_previousConvictions_Yes',
          validationMessage: 'Please enter details of the other convictions',
        },
      },
    ],
    nextPath: {
      path: '/tasklist/',
    },
    validate: true,
  },
  furtherCharges: {
    fields: [
      {
        furtherCharges: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        furtherChargesText: {
          responseType: 'requiredStringIf_furtherCharges_Yes',
          validationMessage: 'Please enter details of the further charges',
        },
      },
      {
        furtherChargesCatB: {
          responseType: 'requiredStringIf_furtherCharges_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    nextPath: {
      path: '/tasklist/',
    },
    validate: true,
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
          validationMessage: 'Please enter the reason why referral is needed',
        },
      },
    ],
    validate: true,
  },
  securityBack: {
    nextPath: {
      path: '/tasklist/',
    },
    fields: [
      {
        catB: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
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
    fields: [
      {
        previousTerrorismOffences: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        previousTerrorismOffencesText: {
          responseType: 'requiredStringIf_previousTerrorismOffences_Yes',
          validationMessage: 'Please enter the previous offences',
        },
      },
    ],
    validate: true,
  },
  escapeRating: {
    nextPath: {
      path: '/tasklist/',
    },
    fields: [
      {
        escapeCatB: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        escapeCatBText: {
          responseType: 'requiredStringIf_escapeCatB_Yes',
          validationMessage: 'Please enter details explaining cat B',
        },
      },
      {
        escapeOtherEvidence: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        escapeOtherEvidenceText: {
          responseType: 'requiredStringIf_escapeOtherEvidence_Yes',
          validationMessage: 'Please enter details of escape risk evidence',
        },
      },
    ],
    validate: true,
  },
  decision: {
    nextPath: {
      path: '/tasklist/',
    },
    fields: [
      {
        category: {
          responseType: 'requiredString',
          validationMessage: 'Select the category that is most suitable for this prisoner',
        },
      },
      {
        justification: {
          responseType: 'requiredString',
          validationMessage: 'You must enter information about why the category is appropriate',
        },
      },
    ],
    validate: true,
  },
}
