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
          validationMessage: 'Select yes if you think this category is appropriate',
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
          validationMessage: 'Enter the reason why you changed the category',
        },
      },
      {
        suggestedCategory: {
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
}
