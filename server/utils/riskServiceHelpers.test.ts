import transformDataToEscapeProfile from './riskServiceHelpers'

describe('transformDataToEscapeProfile', () => {
  it('returns object with default values when input is an empty array', () => {
    const expectedEscapeProfile = {
      activeEscapeList: false,
      activeEscapeRisk: false,
      escapeListAlerts: [],
      escapeRiskAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(transformDataToEscapeProfile([])).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has an escape list alert', () => {
    const escapeListAlertData = [
      {
        alertCode: {
          code: 'XEL',
        },
        activeFrom: '2017-01-27',
        isActive: true,
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: true,
      activeEscapeRisk: false,
      escapeListAlerts: [
        {
          alertCode: 'XEL',
          dateCreated: '2017-01-27',
          active: true,
        },
      ],
      escapeRiskAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(transformDataToEscapeProfile(escapeListAlertData)).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has an escape list heightened alert code', () => {
    const escapeListAlertData = [
      {
        alertCode: {
          code: 'XELH',
        },
        activeFrom: '2017-01-27',
        isActive: true,
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: true,
      activeEscapeRisk: false,
      escapeListAlerts: [
        {
          alertCode: 'XELH',
          dateCreated: '2017-01-27',
          active: true,
        },
      ],
      escapeRiskAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(transformDataToEscapeProfile(escapeListAlertData)).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has an escape risk alert', () => {
    const escapeRiskAlertData = [
      {
        alertCode: {
          code: 'XER',
        },
        activeFrom: '2017-01-27',
        isActive: true,
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: false,
      activeEscapeRisk: true,
      escapeRiskAlerts: [
        {
          alertCode: 'XER',
          dateCreated: '2017-01-27',
          active: true,
        },
      ],
      escapeListAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(transformDataToEscapeProfile(escapeRiskAlertData)).toEqual(expectedEscapeProfile)
  })

  it('returns an object with the correct values if the input has both an escape risk alert and an escape list alert', () => {
    const bothEscapeAlertsData = [
      {
        alertCode: {
          code: 'XEL',
        },
        activeFrom: '2017-01-27',
        isActive: true,
      },
      {
        alertCode: {
          code: 'XER',
        },
        activeFrom: '2017-01-27',
        isActive: true,
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: true,
      activeEscapeRisk: true,
      escapeRiskAlerts: [
        {
          alertCode: 'XER',
          dateCreated: '2017-01-27',
          active: true,
        },
      ],
      escapeListAlerts: [
        {
          alertCode: 'XEL',
          dateCreated: '2017-01-27',
          active: true,
        },
      ],
      riskType: 'ESCAPE',
    }

    expect(transformDataToEscapeProfile(bothEscapeAlertsData)).toEqual(expectedEscapeProfile)
  })

  it('returns the correct values for inactive alerts', () => {
    const escapeRiskAlertData = [
      {
        alertCode: {
          code: 'XER',
        },
        activeFrom: '2017-01-27',
        isActive: false,
      },
    ]

    const expectedEscapeProfile = {
      activeEscapeList: false,
      activeEscapeRisk: false,
      escapeRiskAlerts: [
        {
          alertCode: 'XER',
          dateCreated: '2017-01-27',
          active: false,
        },
      ],
      escapeListAlerts: [],
      riskType: 'ESCAPE',
    }

    expect(transformDataToEscapeProfile(escapeRiskAlertData)).toEqual(expectedEscapeProfile)
  })
})
