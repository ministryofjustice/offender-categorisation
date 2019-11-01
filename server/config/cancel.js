module.exports = {
  fields: [
    {
      confirm: {
        responseType: 'requiredString',
        validationMessage: 'Please select yes or no',
      },
    },
  ],
  validate: true,
  nextPath: {
    path: '/form/cancelConfirmed/',
  },
}
