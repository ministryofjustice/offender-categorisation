const serviceCreator = require('../../server/services/sqsService')
const db = require('../../server/data/dataAccess/db')
const { events } = require('../../server/utils/eventUtils')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
db.pool.connect = jest.fn()

const offendersService = {
  getOffenderDetailWithFullInfo: jest.fn(),
  checkAndMergeOffenderNo: jest.fn(),
  handleExternalMovementEvent: jest.fn(),
}

const formService = {
  createRiskChange: jest.fn(),
  deletePendingCategorisations: jest.fn(),
}

let service

beforeEach(() => {
  service = serviceCreator(offendersService, formService)
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('rpQueueConsumer', () => {
  const profile = buildProfile()
  test('should ignore old and new profiles with no change', async () => {
    await service.rpQueueConsumer.handleMessage({
      Body: `{"offenderNo": "GN123", "oldProfile":${JSON.stringify(profile)}, "newProfile":${JSON.stringify(
        profile,
      )} }`,
    })
    expect(offendersService.getOffenderDetailWithFullInfo).not.toBeCalled()
  })
  test('should ignore old and new profiles with a change that is not of interest', async () => {
    const newProfile = buildProfile({ socPC: 'B' })
    await service.rpQueueConsumer.handleMessage({
      Body: `{"offenderNo": "GN123", "oldProfile":${JSON.stringify(profile)}, "newProfile":${JSON.stringify(
        newProfile,
      )} }`,
    })
    expect(offendersService.getOffenderDetailWithFullInfo).not.toBeCalled()
  })
  test('should ignore an offender with a category that cannot be increased', async () => {
    offendersService.getOffenderDetailWithFullInfo.mockResolvedValue({
      offenderNo: 'B2345XY',
      bookingId: 12,
      categoryCode: 'B',
    })
    const newProfile = buildProfile({ activeEscapeList: true })
    await service.rpQueueConsumer.handleMessage({
      Body: `{"offenderNo": "GN123", "oldProfile":${JSON.stringify(profile)}, "newProfile":${JSON.stringify(
        newProfile,
      )} }`,
    })
    expect(offendersService.getOffenderDetailWithFullInfo).toBeCalledWith({ user: {} }, 'GN123')
  })
})

function buildProfile({
  activeEscapeList = false,
  activeEscapeRisk = true,
  assaults = 0,
  seriousAssaults = 0,
  notifySCL = false,
  violentOffender = false,
  escapeListAlerts = [],
  escapeRiskAlerts = [],
  socPC = 'C',
} = {}) {
  return {
    soc: {
      nomsId: 'G1709GX',
      riskType: 'SOC',
      transferToSecurity: false,
      provisionalCategorisation: socPC,
    },
    escape: {
      nomsId: 'G1709GX',
      riskType: 'ESCAPE',
      activeEscapeList,
      activeEscapeRisk,
      escapeListAlerts,
      escapeRiskAlerts,
      provisionalCategorisation: 'C',
    },
    violence: {
      nomsId: 'G1709GX',
      riskType: 'VIOLENCE',
      displayAssaults: false,
      numberOfAssaults: assaults,
      notifySafetyCustodyLead: notifySCL,
      numberOfSeriousAssaults: seriousAssaults,
      provisionalCategorisation: 'C',
      veryHighRiskViolentOffender: violentOffender,
    },
  }
}

describe('eventQueueConsumer', () => {
  test('merge event', async () => {
    await service.eventQueueConsumer.handleMessage({
      MessageId: '21b86d12-74be-4208-9f0b-7ffcb4213184',
      Body: '{ "Message" : "{\\"eventType\\": \\"BOOKING_NUMBER-CHANGED\\", \\"bookingId\\": 123}"}',
    })

    expect(offendersService.checkAndMergeOffenderNo).toBeCalled()
    expect(offendersService.checkAndMergeOffenderNo.mock.calls[0][0].user).toBeTruthy()
    expect(offendersService.checkAndMergeOffenderNo.mock.calls[0][1]).toEqual(123)
    expect(offendersService.checkAndMergeOffenderNo.mock.calls[0][2]).toEqual(mockTransactionalClient)
  })

  test('movement event', async () => {
    await service.eventQueueConsumer.handleMessage({
      MessageId: '21b86d12-74be-4208-9f0b-7ffcb4213184',
      Body: '{ "Message" : "{\\"eventType\\": \\"EXTERNAL_MOVEMENT_RECORD-INSERTED\\", \\"bookingId\\": 124, \\"offenderIdDisplay\\": \\"A1234AA\\", \\"movementType\\": \\"ADM\\", \\"fromAgencyLocationId\\": \\"FROM\\", \\"toAgencyLocationId\\": \\"TO\\"}"}',
    })

    expect(offendersService.handleExternalMovementEvent).toBeCalled()
    expect(offendersService.handleExternalMovementEvent.mock.calls[0][0].user).toBeTruthy()
    expect(offendersService.handleExternalMovementEvent.mock.calls[0][1]).toEqual(124)
    expect(offendersService.handleExternalMovementEvent.mock.calls[0][2]).toEqual('A1234AA')
    expect(offendersService.handleExternalMovementEvent.mock.calls[0][3]).toEqual('ADM')
    expect(offendersService.handleExternalMovementEvent.mock.calls[0][4]).toEqual('FROM')
    expect(offendersService.handleExternalMovementEvent.mock.calls[0][5]).toEqual('TO')
    expect(offendersService.handleExternalMovementEvent.mock.calls[0][6]).toEqual(mockTransactionalClient)
  })

  describe(`${events.EVENT_DOMAIN_PRISONER_OFFENDER_SEARCH_PRISONER_RELEASED} event handler`, () => {
    const offenderId = 'T123456'

    const createPrisonerReleasedMessage = (nomsNumber, reason = 'RELEASED') => {
      return {
        Body: JSON.stringify({
          Type: 'Notification',
          MessageId: 'fake-message-id',
          TopicArn: 'arn:aws:sns:fake',
          Message: `{"additionalInformation":{"nomsNumber":"${nomsNumber}","reason":"${reason}","prisonId":"WTI"},"occurredAt":"2024-07-25T07:57:37.883940701+01:00","eventType":"prisoner-offender-search.prisoner.released","version":1,"description":"A prisoner has been released from a prison with reason: released on temporary absence","detailUrl":"https://prisoner-search.prison.service.justice.gov.uk/prisoner/${nomsNumber}"}`,
          Timestamp: '2024-07-25T06:57:39.938Z',
          SignatureVersion: '1',
          Signature: 'fakesig',
          SigningCertURL: 'https://some.pem',
          UnsubscribeURL: 'https://fake.url',
          MessageAttributes: {
            traceparent: { Type: 'String', Value: 'a-guid' },
            eventType: { Type: 'String', Value: 'prisoner-offender-search.prisoner.released' },
          },
        }),
      }
    }

    it('should delete pending categorisations', async () => {
      const event = createPrisonerReleasedMessage(offenderId)

      await service.eventQueueConsumer.handleMessage(event)

      expect(formService.deletePendingCategorisations).toHaveBeenCalledTimes(1)
      expect(formService.deletePendingCategorisations.mock.calls[0][0]).toEqual(offenderId)
      expect(formService.deletePendingCategorisations.mock.calls[0][1]).toEqual(mockTransactionalClient)
    })

    it('should exit early if a nomsNumber is unavailable', async () => {
      const event = createPrisonerReleasedMessage('')

      await service.eventQueueConsumer.handleMessage(event)

      expect(formService.deletePendingCategorisations).not.toHaveBeenCalled()
    })

    // -- spacer
    ;[null, false, 'OTHER_REASON', '', 'reason'].forEach(invalidReason => {
      it(`should only delete when the reason is "RELEASED", given: "${invalidReason}"`, async () => {
        const event = createPrisonerReleasedMessage(offenderId, invalidReason)

        await service.eventQueueConsumer.handleMessage(event)

        expect(formService.deletePendingCategorisations).not.toHaveBeenCalled()
      })
    })
  })
})
