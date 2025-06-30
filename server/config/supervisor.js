module.exports = {
  review: {
    fields: [
      {
        supervisorDecision: {
          responseType: 'requiredString',
          validationMessage: 'Select what you would like to do next',
        },
      },
    ],
    validate: true,
  },
  furtherInformation: {
    nextPath: {
      path: '/tasklist/supervisor/outcome/',
    },
    fields: [
      {
        otherInformationText: {
          responseType: 'optionalString',
        },
      },
    ],
    validate: true,
  },
  changeCategory: {
    fields: [
      {
        otherInformationText: {
          responseType: 'optionalString',
        },
      },
    ],
    validate: true,
  },
  giveBackToCategoriser: {
    fields: [
      {
        otherInformationText: {
          responseType: 'optionalString',
        },
      },
    ],
    validate: true,
  },
  confirmBack: {
    fields: [
      {
        supervisorName: {
          responseType: 'optionalString',
        },
      },
      {
        confirmation: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        messageText: {
          responseType: 'requiredStringIf_confirmation_Yes',
          validationMessage: 'Please enter a message for the categorisor',
        },
      },
    ],
    validate: true,
  },
}
