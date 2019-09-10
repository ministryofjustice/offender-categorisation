module.exports = {
  riskAssessment: {
    fields: [
      {
        lowerCategory: {
          responseType: 'requiredString',
          validationMessage: 'Please enter lower security category details',
        },
      },
      {
        higherCategory: {
          responseType: 'requiredString',
          validationMessage: 'Please enter higher security category details',
        },
      },
      {
        otherRelevant: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        otherRelevantText: {
          responseType: 'requiredStringIf_otherRelevant_Yes',
          validationMessage: 'Please enter other relevant information',
        },
      },
    ],
    nextPath: {
      path: '/tasklistRecat/',
    },
    validate: true,
  },
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
          responseType: 'requiredStringIf_transfer_No',
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
  miniHigherSecurityReview: {
    fields: [
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
  decision: {
    nextPath: {
      path: '/tasklistRecat/',
    },
    fields: [
      {
        category: {
          responseType: 'requiredString',
          validationMessage: 'Please select a security condition',
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
      path: '/form/recat/nextReviewDate/',
    },
  },
  nextReviewDate: {
    fields: [
      {
        date: {
          responseType: 'futureDate',
          validationMessage: 'Enter a valid date that is after today',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/tasklistRecat/',
    },
  },
  review: {
    nextPath: {
      path: '/tasklistRecat/recategoriserSubmitted/',
    },
  },
  prisonerBackground: {
    fields: [
      {
        offenceDetails: {
          responseType: 'requiredString',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/tasklistRecat/',
    },
    validate: true,
  },
  riskProfileChangeDetail: {
    fields: [
      {
        confirmation: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    validate: true,
  },
}
