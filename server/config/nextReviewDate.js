module.exports = {
  nextReviewDateQuestion: {
    fields: [
      {
        nextDateChoice: {
          responseType: 'requiredString',
          validationMessage: 'Please select a choice',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/form/nextReviewDate/nextReviewDate/',
    },
  },
  nextReviewDate: {
    fields: [
      {
        indeterminate: {
          responseType: 'requiredString',
          validationMessage: '',
        },
      },
      {
        date: {
          responseType: 'indeterminateCheck_indeterminate_true',
          validationMessage: '',
        },
      },
    ],
    validate: true,
    nextPath: {
      decisions: { discriminator: 'catType', INITIAL: '/tasklist/', RECAT: '/tasklistRecat/' },
    },
  },
  nextReviewDateStandalone: {
    fields: [
      {
        indeterminate: {
          responseType: 'requiredString',
          validationMessage: '',
        },
      },
      {
        date: {
          responseType: 'indeterminateCheck_indeterminate_true',
          validationMessage: '',
        },
      },
      {
        reason: {
          responseType: 'requiredString',
          validationMessage: 'Please enter a reason for the change',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/',
    },
  },
}
