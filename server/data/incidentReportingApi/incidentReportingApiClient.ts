import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import { subMonths, format } from 'date-fns'
import { config } from '../../config'
import { getApiClientToken } from '../../authentication/clientCredentials'
import logger from '../../../log'
import { getSanitisedError } from '../../getSanitisedError'
import { User } from '../user'
import {
  INCIDENT_REPORT_STATUSES,
  INCIDENT_TYPE_ASSAULT_1,
  INCIDENT_TYPE_ASSAULT_5,
  IncidentReport,
  IncidentReportResponse,
  INVOLVING_PRISONER_ROLES,
} from './incidentReport.dto'

export type IncidentReportingApiClientBuilder = (user: User) => IncidentReportingApiClient

export interface IncidentReportingApiClient {
  getTotalNumberOfIncidents: (prisonerNumber: string) => Promise<number>
  getIncidentIds: (prisonerNumber: string, recentAssaultMonths: number, size: number) => Promise<string[]>
  getDetailedIncidentReport: (incidentId: string) => Promise<IncidentReport>
}

const timeoutSpec = {
  response: config.apis.incidentReportingApi.timeout.response,
  deadline: config.apis.incidentReportingApi.timeout.deadline,
}

const agentOptions = {
  maxSockets: config.apis.incidentReportingApi.agent.maxSockets,
  maxFreeSockets: config.apis.incidentReportingApi.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.incidentReportingApi.agent.freeSocketTimeout,
}

const apiUrl = config.apis.incidentReportingApi.url

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

const ASSAULT_TYPES = [INCIDENT_TYPE_ASSAULT_1, INCIDENT_TYPE_ASSAULT_5]

const assaultReportsForPrisonerQuery = (prisonerNumber: string): string[] => [
  `involvingPrisonerNumber=${encodeURIComponent(prisonerNumber)}`,
  ...INVOLVING_PRISONER_ROLES.map(role => `involvingPrisonerRole=${role}`),
  ...ASSAULT_TYPES.map(type => `type=${type}`),
  ...INCIDENT_REPORT_STATUSES.map(status => `status=${status}`),
]

export const incidentReportingApiClientBuilder: IncidentReportingApiClientBuilder = (user: User) => {
  const apiGet = incidentReportingApiGetBuilder(user.username)

  return {
    async getTotalNumberOfIncidents(prisonerNumber: string): Promise<number> {
      const path = `${apiUrl}incident-reports`
      const query = [...assaultReportsForPrisonerQuery(prisonerNumber), 'size=1'].join('&')
      const response: IncidentReportResponse = await apiGet({ path, query })
      return response.totalElements
    },
    async getIncidentIds(prisonerNumber: string, recentAssaultMonths: number, size: number): Promise<string[]> {
      const incidentDateFrom = format(subMonths(new Date(), recentAssaultMonths), 'yyyy-MM-dd')
      const path = `${apiUrl}incident-reports`
      const query = [
        ...assaultReportsForPrisonerQuery(prisonerNumber),
        `incidentDateFrom=${incidentDateFrom}`,
        `size=${size}`,
      ].join('&')
      const response: IncidentReportResponse = await apiGet({ path, query })
      return response.content.map(report => report.id)
    },
    async getDetailedIncidentReport(incidentId: string): Promise<IncidentReport> {
      const path = `${apiUrl}incident-reports/${incidentId}/with-details`
      return apiGet({ path })
    },
  }
}

function incidentReportingApiGetBuilder(username: string) {
  return async ({ path = '', query = '', headers = {}, responseType = '' } = {}) => {
    try {
      const clientToken = await getApiClientToken(username)

      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${clientToken.body.access_token}`)
        .set(headers)
        .agent(keepaliveAgent)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return result.body
    } catch (error) {
      const sanitisedError = getSanitisedError(error)
      logger.error({ sanitisedError, path, query }, 'Error calling incident reporting api')
      throw sanitisedError
    }
  }
}
