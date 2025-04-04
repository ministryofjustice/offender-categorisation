import BaseApprovedViewPage from './baseApprovedView'

const SELECTORS = {
  PRISONER_SUMMARY: '.prisonerBackgroundSummary',
  OPEN_CONDITIONS_HEADER: '.openConditionsHeader',
}

export default class RecatApprovedViewPage extends BaseApprovedViewPage {
  static baseUrl: string = '/form/approvedView'

  constructor() {
    super('Categorisation review outcome')
  }

  validatePrisonerSummary = (expected: string) =>
    cy
      .get(SELECTORS.PRISONER_SUMMARY)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })
}
