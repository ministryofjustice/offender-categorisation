module.exports = {
  review: {
    // nextPath hardcoded as '/'
    fields: [
      {
        securityReview: {
          responseType: 'requiredString',
          validationMessage: 'Please enter details',
        },
      },
    ],
    validate: true,
  },
}
