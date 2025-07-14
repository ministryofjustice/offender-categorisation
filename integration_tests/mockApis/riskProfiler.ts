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

const stubGetViolenceProfile = ({
  offenderNo,
  category,
  veryHighRiskViolentOffender,
  notifySafetyCustodyLead,
  displayAssaults,
}: {
  offenderNo: string
  category: string
  veryHighRiskViolentOffender: boolean
  notifySafetyCustodyLead: boolean
  displayAssaults: boolean
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/risk-profile/violence/${offenderNo}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        nomsId: offenderNo,
        riskType: 'VIOLENCE',
        provisionalCategorisation: category,
        veryHighRiskViolentOffender: veryHighRiskViolentOffender,
        notifySafetyCustodyLead: notifySafetyCustodyLead,
        displayAssaults: displayAssaults,
        numberOfAssaults: 5,
        numberOfSeriousAssaults: 2,
        numberOfNonSeriousAssaults: 3,
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
  stubGetLifeProfile,
  stubGetSocProfile,
  stubGetViolenceProfile,
  stubRiskProfilerPing,
}
