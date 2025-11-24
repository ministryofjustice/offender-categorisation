import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const stubGetLifeProfile = ({ offenderNo, category }: { offenderNo: string; category: string }): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/risk-profile/life/${offenderNo}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        nomsId: offenderNo,
        riskType: 'LIFE',
        provisionalCategorisation: category,
      },
    },
  })

const stubGetSocProfile = ({
  offenderNo,
  category,
  transferToSecurity,
}: {
  offenderNo: string
  category: string
  transferToSecurity: boolean
}): SuperAgentRequest => {
  return stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/risk-profile/soc/${offenderNo}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        nomsId: offenderNo,
        riskType: 'SOC',
        provisionalCategorisation: category,
        transferToSecurity,
      },
    },
  })
}

const stubRiskProfilerPing = (statusCode = 200): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/ping`,
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
  stubGetLifeProfile,
  stubGetSocProfile,
  stubRiskProfilerPing,
}
