import { mapAlertToEscapeProfile } from './escapeProfileMapper'

describe('mapAlertToEscapeProfile', () => {
  it('returns object with default values when input is an empty array', () => {
    const expectedEscapeProfile = {
      activeEscapeList: false,
      activeEscapeRisk: false,
      escapeListAlerts: [],
      escapeRiskAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(mapAlertToEscapeProfile([])).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has an escape list alert', () => {
    const escapeListAlertData = [
      {
        alertCode: {
          code: 'XEL',
        },
        activeFrom: '2017-01-27',
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: true,
      activeEscapeRisk: false,
      escapeListAlerts: [
        {
          alertCode: 'XEL',
          dateCreated: '2017-01-27',
        },
      ],
      escapeRiskAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(mapAlertToEscapeProfile(escapeListAlertData)).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has an escape list heightened alert code', () => {
    const escapeListAlertData = [
      {
        alertCode: {
          code: 'XELH',
        },
        activeFrom: '2017-01-27',
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: true,
      activeEscapeRisk: false,
      escapeListAlerts: [
        {
          alertCode: 'XELH',
          dateCreated: '2017-01-27',
        },
      ],
      escapeRiskAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(mapAlertToEscapeProfile(escapeListAlertData)).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has an escape risk alert', () => {
    const escapeRiskAlertData = [
      {
        alertCode: {
          code: 'XER',
        },
        activeFrom: '2017-01-27',
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: false,
      activeEscapeRisk: true,
      escapeRiskAlerts: [
        {
          alertCode: 'XER',
          dateCreated: '2017-01-27',
        },
      ],
      escapeListAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(mapAlertToEscapeProfile(escapeRiskAlertData)).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has both an escape risk alert and an escape list alert', () => {
    const bothEscapeAlertsData = [
      {
        alertCode: {
          code: 'XEL',
        },
        activeFrom: '2017-01-27',
      },
      {
        alertCode: {
          code: 'XER',
        },
        activeFrom: '2017-01-27',
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: true,
      activeEscapeRisk: true,
      escapeRiskAlerts: [
        {
          alertCode: 'XER',
          dateCreated: '2017-01-27',
        },
      ],
      escapeListAlerts: [
        {
          alertCode: 'XEL',
          dateCreated: '2017-01-27',
        },
      ],
      riskType: 'ESCAPE',
    }

    expect(mapAlertToEscapeProfile(bothEscapeAlertsData)).toEqual(expectedEscapeProfile)
  })
})
