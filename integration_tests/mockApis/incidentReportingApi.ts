import { Response, SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { IncidentReport } from '../../server/data/incidentReportingApi/incidentReport.dto'

const COMMON_QUERY_FRAGMENT =
  'involvingPrisonerRole=ACTIVE_INVOLVEMENT&involvingPrisonerRole=ASSAILANT&involvingPrisonerRole=FIGHTER&involvingPrisonerRole=IMPEDED_STAFF&involvingPrisonerRole=PERPETRATOR&involvingPrisonerRole=SUSPECTED_ASSAILANT&involvingPrisonerRole=SUSPECTED_INVOLVED&type=ASSAULT_1&type=ASSAULT_5&status=AWAITING_REVIEW&status=ON_HOLD&status=NEEDS_UPDATING&status=UPDATED&status=CLOSED&status=WAS_CLOSED'

const stubCountAssaultIncidents = ({
  prisonerNumber,
  numberOfIncidents,
}: {
  prisonerNumber: string
  numberOfIncidents: number
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/incident-reporting-api/incident-reports',
      queryParameters: {
        involvingPrisonerNumber: { equalTo: prisonerNumber },
        size: { equalTo: '1' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        content: [],
        totalElements: numberOfIncidents,
      },
    },
  })

const stubSearchAssaultIncidents = ({
  prisonerNumber,
  ids,
}: {
  prisonerNumber: string
  ids: string[]
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/incident-reporting-api/incident-reports',
      queryParameters: {
        involvingPrisonerNumber: { equalTo: prisonerNumber },
        incidentDateFrom: { matches: '\\d{4}-\\d{2}-\\d{2}' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        content: ids.map(id => ({ id })),
        totalElements: ids.length,
      },
    },
  })

const stubGetIncidentReportById = ({ incident }: { incident: IncidentReport }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/incident-reporting-api/incident-reports/${incident.id}/with-details`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: incident,
    },
  })

const stubGetAssaultIncidents = ({
  prisonerNumber,
  assaultIncidents,
}: {
  prisonerNumber: string
  assaultIncidents: IncidentReport[]
}): Promise<Response[]> =>
  Promise.all([
    stubCountAssaultIncidents({ prisonerNumber, numberOfIncidents: assaultIncidents.length }),
    ...(assaultIncidents.length > 0
      ? [
          stubSearchAssaultIncidents({ prisonerNumber, ids: assaultIncidents.map(i => i.id) }),
          ...assaultIncidents.map(incident => stubGetIncidentReportById({ incident })),
        ]
      : []),
  ])

const stubIncidentReportingApiPing = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/incident-reporting-api/health/ping`,
    },
    response: {
      status: statusCode,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        status: statusCode,
        response: {},
      },
    },
  })

export default {
  stubCountAssaultIncidents,
  stubSearchAssaultIncidents,
  stubGetIncidentReportById,
  stubGetAssaultIncidents,
  stubIncidentReportingApiPing,
}
