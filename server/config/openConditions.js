module.exports = {
  earliestReleaseDate: {
    fields: [
      {
        threeOrMoreYears: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        justify: {
          responseType: 'requiredStringIf_threeOrMoreYears_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        justifyText: {
          responseType: 'requiredStringIf_justify_Yes',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/foreignNationals/',
    },
    validate: true,
  },
  foreignNationals: {
    fields: [
      {
        isForeignNational: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        formCompleted: {
          responseType: 'requiredStringIf_isForeignNational_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        dueDeported: {
          responseType: 'requiredStringIf_formCompleted_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        exhaustedAppeal: {
          responseType: 'requiredStringIf_dueDeported_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/riskOfHarm/',
    },
    validate: true,
  },
  riskOfHarm: {
    fields: [
      {
        seriousHarm: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        harmManaged: {
          responseType: 'requiredStringIf_seriousHarm_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        harmManagedText: {
          responseType: 'requiredStringIf_seriousHarm_Yes',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/furtherCharges/',
    },
    validate: true,
  },
  furtherCharges: {
    fields: [
      {
        increasedRisk: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        furtherChargesText: {
          responseType: 'requiredString',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/riskLevels/',
    },
    validate: true,
  },
  riskLevels: {
    fields: [
      {
        likelyToAbscond: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        likelyToAbscondText: {
          responseType: 'requiredStringIf_likelyToAbscond_Yes',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/suitability/',
    },
    validate: true,
  },
  suitability: {
    fields: [
      {
        isOtherInformation: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        otherInformationText: {
          responseType: 'requiredStringIf_isOtherInformation_Yes',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/reviewOpenConditions/',
    },
    validate: true,
  },
  reviewOpenConditions: {
    nextPath: {
      path: '/form/openConditions/provisionalCategory/',
    },
    validate: false,
  },
  notRecommended: {
    fields: [
      {
        stillRefer: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/provisionalCategory/',
    },
    validate: true,
  },
}
