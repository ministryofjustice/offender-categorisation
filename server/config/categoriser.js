module.exports = {
  review: {
    nextPath: {
      path: '/form/categoriser/provisionalCategory/',
    },
  },
  provisionalCategory: {
    nextPath: {
      path: '/tasklist/categoriserSubmitted/',
    },
    fields: [
      {
        categoryAppropriate: {
          responseType: 'requiredString',
        },
      },
      {
        overriddenCategory: {
          responseType: 'requiredStringIf_categoryAppropriate_No',
          validationMessage: 'Please enter the new category',
        },
      },
      {
        overriddenCategoryText: {
          responseType: 'requiredStringIf_categoryAppropriate_No',
          validationMessage: 'Please enter the reason why you changed the category',
        },
      },
      {
        suggestedCategory: {
          responseType: 'optionalString',
        },
      },
    ],
    validate: true,
  },
}
