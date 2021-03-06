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
          validationMessage: 'Please select yes or no',
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
      {
        otherInformationText: {
          responseType: 'optionalString',
        },
      },
    ],
    validate: true,
  },
}
