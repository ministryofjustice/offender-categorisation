module.exports = {
  // nextPath hardcoded
  review: {
    fields: [
      {
        securityReview: {
          responseType: 'requiredString',
          validationMessage: 'Enter security information',
        },
      },
    ],
    validate: true,
  },
  cancel: {
    fields: [
      {
        confirm: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    validate: true,
  },
}
