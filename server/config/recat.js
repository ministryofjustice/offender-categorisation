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
          validationMessage: '',
        },
      },
      {
        securityNoteNeeded: {
          responseType: 'requiredString',
          validationMessage: 'Select yes if you want to include a note to security',
        },
      },
      {
        securityInputNeededText: {
          responseType: 'requiredStringIf_securityNoteNeeded_Yes',
          validationMessage: 'Enter a note',
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
          validationMessage: 'Select what category is most suitable for this person',
        },
      },
      {
        justification: {
          responseType: 'requiredString',
          validationMessage: 'You must enter information about why the category is appropriate',
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
  previousRiskAssessments: {
    fields: [
      {
        haveTheyHadRecentOasysAssessment: {
          responseType: 'requiredString',
          validationMessage: 'Please select an option',
        },
      },
    ],
    validate: true,
  },
  oasysInput: {
    nextPath: {
      path: '/tasklistRecat/',
    },
    fields: [
      {
        oasysRelevantInfo: {
          responseType: 'requiredString',
          validationMessage:
            'Select yes if there was any information in the assessment that is relevant to the recategorisation',
        },
      },
      {
        oasysInputText: {
          responseType: 'requiredStringIf_oasysRelevantInfo_Yes',
          validationMessage: 'Enter any information relevant to their categorisation',
        },
      },
    ],
    validate: true,
  },
  bcstInput: {
    nextPath: {
      path: '/tasklistRecat/',
    },
    fields: [
      {
        bcstRelevantInfo: {
          responseType: 'requiredString',
          validationMessage:
            'Select yes if there was any information in the assessment that is relevant to the recategorisation',
        },
      },
      {
        bcstInputText: {
          responseType: 'requiredStringIf_bcstRelevantInfo_Yes',
          validationMessage: 'Enter any information relevant to their categorisation',
        },
      },
    ],
    validate: true,
  },
}
