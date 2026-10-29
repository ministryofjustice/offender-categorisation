import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  // Cat lite
  LITE_CAT_DUE_APPROVAL_LIST = 'LITE_CAT_DUE_APPROVAL_LIST',
  NEW_LITE_CAT = 'NEW_LITE_CAT',
  APPROVE_LITE_CAT = 'APPROVE_LITE_CAT',

  // Initial cat
  INITIAL_CAT_TASKLIST = 'INITIAL_CAT_TASKLIST',
  INITIAL_CAT_OFFENDING_HISTORY_FORM = 'INITIAL_CAT_OFFENDING_HISTORY_FORM',
  INITIAL_CAT_SECURITY_INPUT_FORM = 'INITIAL_CAT_SECURITY_INPUT_FORM',
  INITIAL_CAT_SECURITY_INPUT_REVIEW_FORM = 'INITIAL_CAT_SECURITY_INPUT_REVIEW_FORM',
  INITIAL_CAT_VIOLENCE_RATING_FORM = 'INITIAL_CAT_VIOLENCE_RATING_FORM',
  INITIAL_CAT_ESCAPE_RATING_FORM = 'INITIAL_CAT_ESCAPE_RATING_FORM',
  INITIAL_CAT_EXTREMISM_RATING_FORM = 'INITIAL_CAT_EXTREMISM_RATING_FORM',
  INITIAL_CAT_PROVISIONAL_CATEGORY_FORM = 'INITIAL_CAT_PROVISIONAL_CATEGORY_FORM',
  INITIAL_CAT_DECISION_FORM = 'INITIAL_CAT_DECISION_FORM',
  INITIAL_CAT_REVIEW_FORM = 'INITIAL_CAT_REVIEW_FORM',
  INITIAL_CATEGORISATION_FORM_SECTION = 'INITIAL_CATEGORISATION_FORM_SECTION',
  INITIAL_CATEGORISATION_AWAITING_APPROVAL = 'INITIAL_CATEGORISATION_AWAITING_APPROVAL',
  COMPLETED_APPROVED_INITIAL_CATEGORISATION = 'COMPLETED_APPROVED_INITIAL_CATEGORISATION',

  // Open conditions
  OPEN_CONDITIONS_FURTHER_CHARGES = 'OPEN_CONDITIONS_FURTHER_CHARGES',
  OPEN_CONDITIONS_PROVISIONAL_CATEGORY_FORM = 'OPEN_CONDITIONS_PROVISIONAL_CATEGORY_FORM',
  OPEN_CONDITIONS_FORM = 'OPEN_CONDITIONS_FORM',
  OPEN_CONDITIONS_RISK_LEVELS = 'OPEN_CONDITIONS_RISK_LEVELS',
  OPEN_CONDITIONS_NOT_RECOMMENDED = 'OPEN_CONDITIONS_NOT_RECOMMENDED',

  // Shared
  CATEGORISATION_REQUIRES_AMENDMENTS_FORM = 'CATEGORISATION_REQUIRES_AMENDMENTS_FORM',
  CANCEL_CATEGORISATION = 'CANCEL_CATEGORISATION',
  CATEGORISATION = 'CATEGORISATION',

  // Supervisor
  SUPERVISOR_REVIEW_CATEGORISATION = 'SUPERVISOR_REVIEW_CATEGORISATION',
  SUPERVISOR_CHANGE_CATEGORY = 'SUPERVISOR_CHANGE_CATEGORY',
  SUPERVISOR_REQUIRE_AMENDMENTS = 'SUPERVISOR_REQUIRE_AMENDMENTS',

  // Security
  SECURITY_FORM = 'SECURITY_FORM',
}

export const SUBJECT_TYPE_PRISONER_NUMBER = 'PRISONER_NUMBER'

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

const EventPrefix = {
  pageView: 'PAGE_VIEW',
  create: 'CREATE',
  edit: 'EDIT',
  delete: 'DELETE',
}

type EventPrefixValue = (typeof EventPrefix)[keyof typeof EventPrefix]

export default class AuditService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  private async logEvent(prefix: EventPrefixValue, page: Page, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `${prefix}_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: Page, eventDetails: PageViewEventDetails) {
    await this.logEvent(EventPrefix.pageView, page, eventDetails)
  }

  async logCreateEvent(page: Page, eventDetails: PageViewEventDetails) {
    await this.logEvent(EventPrefix.create, page, eventDetails)
  }

  async logEditEvent(page: Page, eventDetails: PageViewEventDetails) {
    await this.logEvent(EventPrefix.edit, page, eventDetails)
  }

  async logDeleteEvent(page: Page, eventDetails: PageViewEventDetails) {
    await this.logEvent(EventPrefix.delete, page, eventDetails)
  }
}
