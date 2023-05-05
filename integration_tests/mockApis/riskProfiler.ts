import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

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

const stubGetExtremismProfile = ({
  offenderNo,
  category,
  increasedRisk,
  notifyRegionalCTLead,
  previousOffences = false,
}: {
  offenderNo: string
  category: string
  increasedRisk: boolean
  notifyRegionalCTLead: boolean
  previousOffences: boolean
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/risk-profile/extremism/${offenderNo}?previousOffences=${previousOffences}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        nomsId: offenderNo,
        riskType: 'EXTREMISM',
        provisionalCategorisation: category,
        increasedRiskOfExtremism: increasedRisk,
        notifyRegionalCTLead: notifyRegionalCTLead,
      },
    },
  })

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
  stubGetSocProfile,
  stubGetExtremismProfile,
  stubRiskProfilerPing,
}
