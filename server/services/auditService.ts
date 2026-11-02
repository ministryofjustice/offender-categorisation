import { AuditService as AuthAuditService, AuditEvent, SubjectType } from '@ministryofjustice/hmpps-audit-client'

export enum Page {
  LITE_CAT_DUE_APPROVAL_LIST = 'LITE_CAT_DUE_APPROVAL_LIST',
  NEW_LITE_CAT = 'NEW_LITE_CAT',
  APPROVE_LITE_CAT = 'APPROVE_LITE_CAT',
}

export const SUBJECT_TYPE_PRISONER_NUMBER: SubjectType = 'PRISONER_ID'

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: SubjectType
  correlationId?: string
  details?: Record<string, unknown>
}

export default class AuditService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly authAuditService: AuthAuditService) {}

  async logPageView(page: Page, eventDetails: PageViewEventDetails) {
    const event = {
      ...eventDetails,
      what: `VIEW_${page}`,
    }
    await this.authAuditService.logAuditEvent(event)
  }

  async logCreateEvent(page: Page, eventDetails: AuditEvent) {
    const event = {
      ...eventDetails,
      what: `CREATE_${page}`,
    }
    await this.authAuditService.logAuditEvent(event)
  }
}
