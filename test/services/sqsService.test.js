const serviceCreator = require('../../server/services/sqsService')

const offendersService = {
  getOffenderDetailWithFullInfo: jest.fn(),
}

const formService = {
  createRiskChange: jest.fn(),
}

let service

beforeEach(() => {
  service = serviceCreator(offendersService, formService)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('handleMessage', () => {
  const profile = buildProfile()
  test('should ignore old and new profiles with no change', async () => {
    await service.rpQueueConsumer.handleMessage({
      Body: `{"offenderNo": "GN123", "oldProfile":${JSON.stringify(profile)}, "newProfile":${JSON.stringify(
        profile
      )} }`,
    })
    expect(offendersService.getOffenderDetailWithFullInfo).not.toBeCalled()
  })
  test('should ignore old and new profiles with a change that is not of interest', async () => {
    const newProfile = buildProfile({ socPC: 'B' })
    await service.rpQueueConsumer.handleMessage({
      Body: `{"offenderNo": "GN123", "oldProfile":${JSON.stringify(profile)}, "newProfile":${JSON.stringify(
        newProfile
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
    const newProfile = buildProfile({ increasedRiskOfExtremism: true })
    await service.rpQueueConsumer.handleMessage({
      Body: `{"offenderNo": "GN123", "oldProfile":${JSON.stringify(profile)}, "newProfile":${JSON.stringify(
        newProfile
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
  notifyRCTL = false,
  increasedRiskOfExtremism = false,
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
    extremism: {
      nomsId: 'G1709GX',
      riskType: 'EXTREMISM',
      notifyRegionalCTLead: notifyRCTL,
      increasedRiskOfExtremism,
      provisionalCategorisation: 'C',
    },
  }
}
