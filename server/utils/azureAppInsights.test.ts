import { initialiseTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import { initialise } from './azureAppInsights'

jest.mock('@ministryofjustice/hmpps-azure-telemetry', () => {
  const mockStartRecording = jest.fn()
  const mockAddModifier = jest.fn().mockReturnValue({ startRecording: mockStartRecording })
  const mockAddFilter = jest.fn().mockReturnValue({ addModifier: mockAddModifier })

  return {
    initialiseTelemetry: jest.fn().mockReturnValue({ addFilter: mockAddFilter }),
    flushTelemetry: jest.fn().mockResolvedValue(undefined),
    telemetry: {
      processors: {
        filterSpanWherePath: jest.fn().mockReturnValue('mockFilter'),
        enrichSpanNameWithHttpRoute: jest.fn().mockReturnValue('mockModifier'),
      },
    },
  }
})

const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...originalEnv }
  delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  delete process.env.BUILD_NUMBER
  delete process.env.DEBUG_TELEMETRY
})

afterAll(() => {
  process.env = originalEnv
})

describe('initialise', () => {
  it('initialises telemetry with the correct service name and connection string', () => {
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'InstrumentationKey=test-key'
    process.env.BUILD_NUMBER = '1.2.3'

    initialise('offender-categorisation')

    expect(initialiseTelemetry).toHaveBeenCalledWith({
      serviceName: 'offender-categorisation',
      serviceVersion: '1.2.3',
      connectionString: 'InstrumentationKey=test-key',
      debug: false,
    })
  })

  it('defaults serviceVersion to "unknown" when BUILD_NUMBER is not set', () => {
    initialise('offender-categorisation')

    expect(initialiseTelemetry).toHaveBeenCalledWith(expect.objectContaining({ serviceVersion: 'unknown' }))
  })

  it('enables debug mode when DEBUG_TELEMETRY is "true"', () => {
    process.env.DEBUG_TELEMETRY = 'true'

    initialise('offender-categorisation')

    expect(initialiseTelemetry).toHaveBeenCalledWith(expect.objectContaining({ debug: true }))
  })

  it('configures the health/asset path filter', () => {
    initialise('offender-categorisation')

    const { addFilter } = (initialiseTelemetry as unknown as jest.Mock).mock.results[0].value

    expect(telemetry.processors.filterSpanWherePath).toHaveBeenCalledWith([
      '/health',
      '/ping',
      '/info',
      '/assets/*',
      '/favicon.ico',
    ])
    expect(addFilter).toHaveBeenCalledWith('mockFilter')
  })

  it('configures the http route name modifier and starts recording', () => {
    initialise('offender-categorisation')

    const { addFilter } = (initialiseTelemetry as unknown as jest.Mock).mock.results[0].value
    const afterFilter = (addFilter as jest.Mock).mock.results[0].value
    const afterModifier = (afterFilter.addModifier as jest.Mock).mock.results[0].value

    expect(telemetry.processors.enrichSpanNameWithHttpRoute).toHaveBeenCalled()
    expect(afterFilter.addModifier).toHaveBeenCalledWith('mockModifier')
    expect(afterModifier.startRecording).toHaveBeenCalled()
  })
})
