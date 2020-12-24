module.exports = {
  review: {
    nextPath: {
      path: '/tasklist/supervisor/outcome/',
    },
    fields: [
      {
        supervisorCategoryAppropriate: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        supervisorOverriddenCategory: {
          responseType: 'requiredStringIf_supervisorCategoryAppropriate_No',
          validationMessage: 'Please enter the new category',
        },
      },
      {
        supervisorOverriddenCategoryText: {
          responseType: 'requiredStringIf_supervisorCategoryAppropriate_No',
          validationMessage: 'Please enter the reason why you changed the category',
        },
      },
      {
        previousOverrideCategoryText: {
          responseType: 'optionalString',
        },
      },
      {
        proposedCategory: {
          responseType: 'optionalString',
        },
      },
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
