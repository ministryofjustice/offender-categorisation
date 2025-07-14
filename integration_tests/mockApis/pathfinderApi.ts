import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const stubGetExtremismProfile = ({ offenderNo, band }: { offenderNo: string; band: number }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/pathfinder-api/pathfinder/nominal/noms-id/${offenderNo}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        band: band,
      },
    },
  })

const stubPathfinderPing = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/pathfinder-api/health/ping',
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
  stubGetExtremismProfile,
  stubPathfinderPing,
}
