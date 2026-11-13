import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const stubGetPrison = ({ prisonId }: { prisonId: string }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/prison-register-api/prisons/id/${prisonId}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        prisonId: prisonId,
        prisonName: `${prisonId} prison`,
      },
    },
  })

const stubGetPrisons = (): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/prison-register-api/prisons`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        { prisonId: 'SYI', prisonName: 'SHREWSBURY (HMP)' },
        { prisonId: 'BXI', prisonName: 'BRIXTON (HMP)' },
        { prisonId: 'MDI', prisonName: 'MOORLAND' },
      ],
    },
  })

export default {
  stubGetPrison,
  stubGetPrisons,
}
