/*
 * Initialise telemetry
 */
import { flushTelemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import { initialise } from '../../server/utils/azureAppInsights'
import logger from '../../log'

initialise('offender-categorisation-dlq-job')

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const { clearDLQs } = require('./clearDeadLetterQueues') as { clearDLQs: () => Promise<void> }

// eslint-disable-next-line func-names
setTimeout(function () {
  clearDLQs()
    .then(() => flushTelemetry().finally(() => process.exit(0)))
    .catch(error => {
      logger.error(error, 'Problem polling')
      flushTelemetry().finally(() => process.exit(1))
    })
}, 5000)
