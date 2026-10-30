const { AuditServiceFactory } = require('@ministryofjustice/hmpps-audit-client')
const createApp = require('./app')

const formClient = require('./data/formClient')
const { formApiClientBuilder } = require('./data/formApi/formApiClient')
const statsClient = require('./data/statsClient')
const nomisClientBuilder = require('./data/nomisClientBuilder')
const allocationClientBuilder = require('./data/allocationManagerApi')
const prisonerSearchClientBuilder = require('./data/prisonerSearchApi')
const dpsFeComponentsClientBuilder = require('./data/dpsFeComponentsClientBuilder')
const { pathfinderApiClientBuilder } = require('./data/pathfinderApi/pathfinderApiClient')
const { alertsApiClientBuilder } = require('./data/alertsApi/alertsApiClient')
const risksAndNeedsClientBuilder = require('./data/risksAndNeeds/risksAndNeedsApi').default
const probationOffenderSearchClientBuilder =
  require('./data/probationOffenderSearch/probationOffenderSearchApiClient').default
const { adjudicationsApiClientBuilder } = require('./data/adjudicationsApi/adjudicationsApiClient')
const { incidentReportingApiClientBuilder } = require('./data/incidentReportingApi/incidentReportingApiClient')

const createFormService = require('./services/formService')
const createStatsService = require('./services/statsService')
const createOffendersService = require('./services/offendersService')
const createUserService = require('./services/userService')
const createSqsService = require('./services/sqsService')
const createDpsFeComponentService = require('./services/dpsFeComponentService')
const AuditService = require('./services/auditService').default
const CreatePathfinderService = require('./services/pathfinderService').default
const CreateAlertService = require('./services/alertService').default
const { config } = require('./config')
const logger = require('../log')

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
  adjudicationsApiClientBuilder,
  incidentReportingApiClientBuilder,
)
const userService = createUserService(nomisClientBuilder)
const sqsService = createSqsService(offendersService, formService)
const frontEndComponentsService = createDpsFeComponentService(dpsFeComponentsClientBuilder)
const pathfinderService = new CreatePathfinderService(pathfinderApiClientBuilder)
const alertService = new CreateAlertService(alertsApiClientBuilder)
const authAuditService = AuditServiceFactory.createAuthAuditService(config.sqs.audit, logger)
const auditService = new AuditService(authAuditService)

const app = createApp({
  formService,
  offendersService,
  userService,
  statsService,
  frontEndComponentsService,
  pathfinderService,
  alertService,
  auditService,
})

module.exports = { app, sqsService }
