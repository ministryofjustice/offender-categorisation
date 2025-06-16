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
          responseType: 'provisionalCategoryOverriddenCategoryTextValidation',
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
          validationMessage: 'You must enter information about why the category is appropriate',
        },
      },
      {
        justification: {
          responseType: 'requiredStringNotExists_otherInformationText',
          validationMessage: 'You must enter information about why the category is appropriate',
        },
      },
    ],
    validate: true,
  },
}
