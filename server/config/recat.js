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
  fasttrackEligibility: {
    fields: [
      {
        earlyCatD: {
          responseType: 'requiredString',
          validationMessage: 'Please enter yes or no',
        },
      },
      {
        increaseCategory: {
          responseType: 'requiredString',
          validationMessage: 'Please enter yes or no',
        },
      },
    ],
    nextPath: {
      path: '/form/recat/fasttrackRemain/',
    },
    validate: true,
  },
  fasttrackRemain: {
    fields: [
      {
        remainCatC: {
          responseType: 'requiredString',
          validationMessage: 'Please enter yes or no',
        },
      },
    ],
    nextPath: {
      decisions: {
        discriminator: 'remainCatC',
        Yes: '/form/recat/fasttrackProgress/',
        No: '/form/recat/fasttrackCancelled/',
      },
    },
    validate: true,
  },
  fasttrackProgress: {
    fields: [
      {
        progressText: {
          responseType: 'requiredString',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/form/recat/fasttrackConfirmation/',
    },
    validate: true,
  },
  oasysInput: {
    nextPath: {
      path: '/tasklistRecat/',
    },
    fields: [
      {
        date: {
          responseType: 'todayOrPastDate',
          validationMessage: '',
          errorMessagePrefix: 'OASys review date',
        },
      },
      {
        oasysHighlightedRisks: {
          responseType: 'requiredString',
          validationMessage: 'Select yes if there were any risks highlighted in OASys',
        },
      },
      {
        oasysInputText: {
          responseType: 'requiredStringIf_oasysHighlightedRisks_Yes',
          validationMessage: 'Enter any information relevant to their categorisation',
        },
      },
    ],
    validate: true,
  },
}
