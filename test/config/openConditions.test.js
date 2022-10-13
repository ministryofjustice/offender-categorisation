const fieldValidation = require('../../server/utils/fieldValidation')
const openConditions = require('../../server/config/openConditions')

describe('Validating Previous Sentences page', () => {
  it('Validation should return the correct error message for blank response to "Do they have a previous sentence of 7 years or more?"', () => {
    const formResponse = { sevenOrMoreYears: '', releasedLastFiveYears: '' }
    expect(fieldValidation.validate(formResponse, openConditions.previousSentences)).toEqual([
      { href: '#sevenOrMoreYears', text: 'Select yes if they have a previous sentence of 7 years or more' },
    ])
  })
  it('Validation should return the correct error message for blank response to "Were they released from this sentence in the last 5 years?"', () => {
    const formResponse = { sevenOrMoreYears: 'Yes', releasedLastFiveYears: '' }
    expect(fieldValidation.validate(formResponse, openConditions.previousSentences)).toEqual([
      {
        href: '#releasedLastFiveYears',
        text: 'Select yes if they were released from this sentence in the last 5 years',
      },
    ])
  })
  it('Validation should return no error messages with "No" to "Do they have a previous sentence of 7 years or more?"', () => {
    const formResponse = { sevenOrMoreYears: 'No', releasedLastFiveYears: '' }
    expect(fieldValidation.validate(formResponse, openConditions.previousSentences)).toEqual([])
  })
  it('Validation should return no error messages for Previous Sentences page with answers "Yes" and "No"', () => {
    const formResponse = { sevenOrMoreYears: 'Yes', releasedLastFiveYears: 'No' }
    expect(fieldValidation.validate(formResponse, openConditions.previousSentences)).toEqual([])
  })
  it('Validation should return no error messages for Previous Sentences page with answers "Yes" and "Yes"', () => {
    const formResponse = { sevenOrMoreYears: 'Yes', releasedLastFiveYears: 'Yes' }
    expect(fieldValidation.validate(formResponse, openConditions.previousSentences)).toEqual([])
  })
})

describe('Validating sexual offences page', () => {
  it('Validation should return the correct error message for blank input to "Have they ever been convicted of a sexual offence??"', () => {
    const formResponse = { haveTheyBeenEverConvicted: '' }
    expect(fieldValidation.validate(formResponse, openConditions.sexualOffences)).toEqual([
      {
        href: '#haveTheyBeenEverConvicted',
        text: 'Select yes if they have ever been convicted of a sexual offence',
      },
    ])
  })
  it('Validation should return the correct error message for blank input to "Were they released from this sentence in the last 5 years?"', () => {
    const formResponse = { haveTheyBeenEverConvicted: 'Yes', canTheRiskBeManaged: '' }
    expect(fieldValidation.validate(formResponse, openConditions.sexualOffences)).toEqual([
      {
        href: '#canTheRiskBeManaged',
        text: 'Select yes if the risk to the public can be managed in open conditions',
      },
    ])
  })
  it('Validation should return the correct error message for blank input to "Give details of how the risk can be managed"', () => {
    const formResponse = { haveTheyBeenEverConvicted: 'Yes', canTheRiskBeManaged: 'Yes', howTheRiskCanBeManaged: '' }
    expect(fieldValidation.validate(formResponse, openConditions.sexualOffences)).toEqual([
      {
        href: '#howTheRiskCanBeManaged',
        text: 'Enter details of how the risk can be managed',
      },
    ])
  })
  it('Validation should return no error messages with every detail filled in', () => {
    const formResponse = {
      haveTheyBeenEverConvicted: 'Yes',
      canTheRiskBeManaged: 'Yes',
      howTheRiskCanBeManaged: 'example',
    }
    expect(fieldValidation.validate(formResponse, openConditions.sexualOffences)).toEqual([])
  })
  it('Validation should return no error messages with Yes and No selected', () => {
    const formResponse = { haveTheyBeenEverConvicted: 'Yes', canTheRiskBeManaged: 'No' }
    expect(fieldValidation.validate(formResponse, openConditions.sexualOffences)).toEqual([])
  })
  it('Validation should return no error messages with both radio buttons No selected', () => {
    const formResponse = { haveTheyBeenEverConvicted: 'No', canTheRiskBeManaged: 'No' }
    expect(fieldValidation.validate(formResponse, openConditions.sexualOffences)).toEqual([])
  })
})
