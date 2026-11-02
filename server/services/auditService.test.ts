import { AuditService as AuthAuditService } from '@ministryofjustice/hmpps-audit-client'
import AuditService, { Page } from './auditService'

describe('Audit service', () => {
  let authAuditService: jest.Mocked<AuthAuditService>
  let auditService: AuditService

  beforeEach(() => {
    authAuditService = {
      logAuditEvent: jest.fn(),
    } as unknown as jest.Mocked<AuthAuditService>

    auditService = new AuditService(authAuditService)
  })

  describe('logPageView', () => {
    it('sends page view event audit message using audit client', async () => {
      await auditService.logPageView(Page.LITE_CAT_DUE_APPROVAL_LIST, {
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(authAuditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'VIEW_LITE_CAT_DUE_APPROVAL_LIST',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })

  describe('logCreateEvent', () => {
    it('sends create event audit message using audit client', async () => {
      await auditService.logCreateEvent(Page.NEW_LITE_CAT, {
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
        what: 'ignored value',
      })

      expect(authAuditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'CREATE_NEW_LITE_CAT',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })

  describe('logEditEvent', () => {
    it('sends edit event audit message using audit client', async () => {
      await auditService.logEditEvent(Page.SUPERVISOR_REVIEW_CATEGORISATION, {
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(authAuditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'EDIT_SUPERVISOR_REVIEW_CATEGORISATION',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })

  describe('logDeleteEvent', () => {
    it('sends delete event audit message using audit client', async () => {
      await auditService.logDeleteEvent(Page.CANCEL_CATEGORISATION, {
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(authAuditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'DELETE_CANCEL_CATEGORISATION',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'PRISONER_ID',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })
})
