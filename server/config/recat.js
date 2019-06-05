module.exports = {
  higherSecurityReview: {
    fields: [
      {
        behaviour: {
          responseType: 'requiredString',
          validationMessage: 'Please enter behaviour details',
        },
      },
      {
        steps: {
          responseType: 'requiredString',
          validationMessage: 'Please enter steps details',
        },
      },
      {
        transfer: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        transferText: {
          responseType: 'requiredStringIf_transfer_Yes',
          validationMessage: 'Please enter transfer details',
        },
      },
      {
        conditions: {
          responseType: 'requiredString',
          validationMessage: 'Please enter security conditions details',
        },
      },
    ],
    nextPath: {
      path: '/tasklistRecat/',
    },
    validate: true,
  },
  securityInput: {
    nextPath: {
      path: '/tasklistRecat/',
    },
    fields: [
      {
        securityInputNeeded: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        securityInputNeededText: {
          responseType: 'requiredStringIf_securityInputNeeded_Yes',
          validationMessage: 'Please enter the reason why referral is needed',
        },
      },
    ],
    validate: true,
  },
  securityBack: {
    nextPath: {
      path: '/tasklistRecat/',
    },
    fields: [],
    validate: true,
  },
  review: {
    nextPath: {
      path: '/tasklistRecat/recategoriserSubmitted/',
    },
  },
}
