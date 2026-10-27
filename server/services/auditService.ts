import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  LITE_CAT_DUE_APPROVAL_LIST = 'LITE_CAT_DUE_APPROVAL_LIST',
  NEW_LITE_CAT = 'NEW_LITE_CAT',
  APPROVE_LITE_CAT = 'APPROVE_LITE_CAT',
}

export const SUBJECT_TYPE_PRISONER_NUMBER = 'PRISONER_NUMBER'

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

export default class AuditService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: Page, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logCreateEvent(page: Page, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `CREATE_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
