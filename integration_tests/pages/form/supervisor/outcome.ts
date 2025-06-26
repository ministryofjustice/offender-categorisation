import Page, { PageElement } from '../../page'
import { CATEGORISATION_TYPE } from '../../../support/categorisationType'

type CAT_TYPE = (typeof CATEGORISATION_TYPE)[keyof typeof CATEGORISATION_TYPE]

export default class SupervisorReviewOutcomePage extends Page {
  private static _bookingId: number
  private static _categorisationType: CAT_TYPE

  static get baseUrl(): string {
    return `/form/supervisor/outcome/${this._bookingId}?catType=${this._categorisationType}`
  }

  constructor() {
    super('Review outcome saved')
  }

  static createForBookingIdAndCategorisationType = (bookingId: number, categorisationType: CAT_TYPE) => {
    this._bookingId = bookingId
    this._categorisationType = categorisationType
    return new SupervisorReviewOutcomePage()
  }

  finishButton = (): PageElement => cy.get('a[href="/"]').contains('Finish')
}
