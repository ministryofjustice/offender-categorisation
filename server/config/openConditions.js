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
          responseType: 'requiredString',
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
      path: '/openConditions/foreignNationals/',
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
      path: '/openConditions/nextpagetba/',
    },
    validate: true,
  },
}
