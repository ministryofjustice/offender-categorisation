module.exports = {
  review: {
    nextPath: {
      path: '/outcome/',
    },
    fields: [
      {
        supervisorCategoryAppropriate: {
          responseType: 'requiredString',
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
    ],
    validate: true,
  },
}
