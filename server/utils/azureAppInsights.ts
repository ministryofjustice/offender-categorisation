import { config } from 'dotenv'
import { initialiseTelemetry, flushTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'

// eslint-disable-next-line import/prefer-default-export
export function initialise(serviceName: string): void {
  config()

  initialiseTelemetry({
    serviceName,
    serviceVersion: process.env.BUILD_NUMBER || 'unknown',
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    debug: process.env.DEBUG_TELEMETRY === 'true',
  })
    .addFilter(telemetry.processors.filterSpanWherePath(['/health', '/ping', '/info', '/assets/*', '/favicon.ico']))
    .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
    .startRecording()
}

const shutdown = async () => {
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown())
process.on('SIGINT', () => shutdown())
