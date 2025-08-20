// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
const { initialiseAppInsights, buildAppInsightsClient } = require('./utils/azure-appinsights')

initialiseAppInsights()
buildAppInsightsClient()

const createApp = require('./app')

const formClient = require('./data/formClient')
const { formApiClientBuilder } = require('./data/formApiClient')
const statsClient = require('./data/statsClient')
const nomisClientBuilder = require('./data/nomisClientBuilder')
const riskProfilerClientBuilder = require('./data/riskProfilerClientBuilder')
const allocationClientBuilder = require('./data/allocationManagerApi')
const prisonerSearchClientBuilder = require('./data/prisonerSearchApi')
const dpsFeComponentsClientBuilder = require('./data/dpsFeComponentsClientBuilder')
const { pathfinderApiClientBuilder } = require('./data/pathfinderApi/pathfinderApiClient')
const { alertsApiClientBuilder } = require('./data/alertsApi/alertsApiClient')
const risksAndNeedsClientBuilder = require('./data/risksAndNeeds/risksAndNeedsApi').default
const probationOffenderSearchClientBuilder =
  require('./data/probationOffenderSearch/probationOffenderSearchApiClient').default

const createFormService = require('./services/formService')
const createStatsService = require('./services/statsService')
const createOffendersService = require('./services/offendersService')
const createUserService = require('./services/userService')
const createRiskProfilerService = require('./services/riskProfilerService')
const createSqsService = require('./services/sqsService')
const createDpsFeComponentService = require('./services/dpsFeComponentService')
const CreatePathfinderService = require('./services/pathfinderService').default
const CreateAlertService = require('./services/alertService').default

// pass in dependencies of service
const formService = createFormService(formClient, formApiClientBuilder)
const statsService = createStatsService(statsClient)
const offendersService = createOffendersService(
  nomisClientBuilder,
  allocationClientBuilder,
  formService,
  prisonerSearchClientBuilder,
  risksAndNeedsClientBuilder,
  probationOffenderSearchClientBuilder,
)
const userService = createUserService(nomisClientBuilder)
const riskProfilerService = createRiskProfilerService(riskProfilerClientBuilder)
const sqsService = createSqsService(offendersService, formService)
const frontEndComponentsService = createDpsFeComponentService(dpsFeComponentsClientBuilder)
const pathfinderService = new CreatePathfinderService(pathfinderApiClientBuilder)
const alertService = new CreateAlertService(alertsApiClientBuilder)

const app = createApp({
  formService,
  offendersService,
  userService,
  riskProfilerService,
  statsService,
  frontEndComponentsService,
  pathfinderService,
  alertService,
})

module.exports = { app, sqsService }
