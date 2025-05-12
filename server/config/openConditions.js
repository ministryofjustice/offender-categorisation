module.exports = {
  tprs: {
    fields: [
      {
        tprsSelected: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/earliestReleaseDate/',
    },
    validate: true,
  },
  earliestReleaseDate: {
    fields: [
      {
        fiveOrMoreYears: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        justify: {
          responseType: 'requiredStringIf_fiveOrMoreYears_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        justifyText: {
          responseType: 'requiredStringIf_justify_Yes',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      decisions: {
        discriminator: 'catType',
        INITIAL: '/form/openConditions/previousSentences/',
        RECAT: '/form/openConditions/victimContactScheme/',
      },
    },
    validate: true,
  },
  previousSentences: {
    fields: [
      {
        releasedLastFiveYears: {
          responseType: 'requiredString',
          validationMessage: 'Select yes if they have been released from a previous sentence in the last 5 years',
        },
      },
      {
        sevenOrMoreYears: {
          responseType: 'requiredStringIf_releasedLastFiveYears_Yes',
          validationMessage: 'Select yes if they have a previous sentence of 7 years or more',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/victimContactScheme/',
    },
    validate: true,
  },
  victimContactScheme: {
    fields: [
      {
        vcsOptedFor: {
          responseType: 'requiredString',
          validationMessage: 'Select Yes if any victims of the crime have opted-in to the Victim Contact Scheme',
        },
      },
      {
        vloResponseText: {
          responseType: 'requiredStringIf_vcsOptedFor_Yes',
          validationMessage: 'Enter the response from the Victim Liaison Officer (VLO)',
        },
      },
    ],
    nextPath: {
      decisions: {
        discriminator: 'catType',
        INITIAL: '/form/openConditions/sexualOffences/',
        RECAT: '/form/openConditions/foreignNational/',
      },
    },
    validate: true,
  },
  sexualOffences: {
    fields: [
      {
        haveTheyBeenEverConvicted: {
          responseType: 'requiredString',
          validationMessage: 'Select yes if they have ever been convicted of a sexual offence',
        },
      },
      {
        canTheRiskBeManaged: {
          responseType: 'requiredStringIf_haveTheyBeenEverConvicted_Yes',
          validationMessage: 'Select yes if the risk to the public can be managed in open conditions',
        },
      },
      {
        howTheRiskCanBeManaged: {
          responseType: 'requiredStringIf_canTheRiskBeManaged_Yes',
          validationMessage: 'Enter details of how the risk can be managed',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/foreignNational/',
    },
    validate: true,
  },
  foreignNational: {
    fields: [
      {
        isForeignNational: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        formCompleted: {
          responseType: 'requiredStringIf_isForeignNational_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        dueDeported: {
          responseType: 'requiredStringIf_formCompleted_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        exhaustedAppeal: {
          responseType: 'requiredStringIf_dueDeported_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/riskOfHarm/',
    },
    validate: true,
  },
  riskOfHarm: {
    fields: [
      {
        seriousHarm: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        harmManaged: {
          responseType: 'requiredStringIf_seriousHarm_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        harmManagedText: {
          responseType: 'requiredStringIf_seriousHarm_Yes',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/furtherCharges/',
    },
    validate: true,
  },
  furtherCharges: {
    fields: [
      {
        furtherCharges: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        furtherChargesText: {
          responseType: 'requiredStringIf_furtherCharges_Yes',
          validationMessage: 'Please enter details',
        },
      },
      {
        increasedRisk: {
          responseType: 'requiredStringIf_furtherCharges_Yes',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    nextPath: {
      path: '/form/openConditions/riskLevels/',
    },
    validate: true,
  },
  riskLevels: {
    fields: [
      {
        likelyToAbscond: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        likelyToAbscondText: {
          responseType: 'requiredStringIf_likelyToAbscond_Yes',
          validationMessage: 'Please enter details',
        },
      },
    ],
    nextPath: {
      decisions: { discriminator: 'catType', INITIAL: '/tasklist/', RECAT: '/tasklistRecat/' },
    },
    validate: true,
  },
  openConditionsNotSuitable: {
    fields: [],
    nextPath: {
      decisions: { discriminator: 'catType', INITIAL: '/tasklist/', RECAT: '/tasklistRecat/' },
    },
    validate: false,
  },
  notRecommended: {
    fields: [
      {
        stillRefer: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
    ],
    nextPath: {
      decisions: { discriminator: 'catType', INITIAL: '/tasklist/', RECAT: '/tasklistRecat/' },
    },
    validate: true,
  },
  provisionalCategory: {
    nextPath: {
      path: '/tasklist/categoriserSubmitted/',
    },
    fields: [
      {
        openConditionsCategoryAppropriate: {
          responseType: 'requiredString',
          validationMessage: 'Please select yes or no',
        },
      },
      {
        overriddenCategory: {
          responseType: 'optionalString',
        },
      },
      {
        overriddenCategoryText: {
          responseType: 'optionalString',
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
