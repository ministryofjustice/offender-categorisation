/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
require('../../server/utils/azure-appinsights')

const clearDLQs = require('./clearDeadLetterQueues')
const logger = require('../../log')

clearDLQs()
  .then(() => {
    // Flush logs to app insights and only exit when complete
    // appInsights.flush({ callback: () => process.exit() })
  })
  .catch(error => {
    logger.error(error, 'Problem polling')
    // appInsights.flush({ callback: () => process.exit() })
  })
