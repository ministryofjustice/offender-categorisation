/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
/* eslint-disable import/first */
import { initialiseAppInsights, buildAppInsightsClient } from '../../server/utils/azure-appinsights'

initialiseAppInsights()
buildAppInsightsClient()

import { clearDLQs } from './clearDeadLetterQueues'
import logger from '../../log'

clearDLQs()
  .then(() => {
    // Flush logs to app insights and only exit when complete
    // appInsights.flush({ callback: () => process.exit() })
  })
  .catch(error => {
    logger.error(error, 'Problem polling')
    // appInsights.flush({ callback: () => process.exit() })
  })
