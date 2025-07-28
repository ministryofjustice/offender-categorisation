module.exports = {
  review: {
    fields: [
      {
        supervisorDecision: {
          responseType: 'requiredString',
          validationMessage: 'Select what you would like to do next',
        },
      },
      {
        supervisorOverriddenCategory: {
          responseType: 'optionalString',
        },
      },
      {
        supervisorCategoryAppropriate: {
          responseType: 'optionalString',
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
        giveBackToCategoriser: {
          responseType: 'requiredString',
        },
      },
      {
        supervisorOverriddenCategoryText: {
          responseType: 'requiredStringIf_giveBackToCategoriser_No',
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
        messageText: {
          responseType: 'requiredString',
          validationMessage: 'Enter your message for the categoriser',
        },
      },
    ],
    validate: true,
  },
}
