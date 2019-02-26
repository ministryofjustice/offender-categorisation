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
        proposedCategory: {
          responseType: 'optionalString',
        },
      },
    ],
    validate: true,
  },
}
