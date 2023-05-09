import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const stubGetEscapeProfile = ({
  offenderNo,
  category,
  onEscapeList,
  activeOnEscapeList,
}: {
  offenderNo: string
  category: string
  onEscapeList: boolean
  activeOnEscapeList: boolean
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/risk-profile/escape/${offenderNo}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        nomsId: offenderNo,
        riskType: 'ESCAPE',
        provisionalCategorisation: category,
        activeEscapeList: onEscapeList,
        activeEscapeRisk: activeOnEscapeList,
        escapeListAlerts: [
          {
            alertCode: 'XEL',
            alertCodeDescription: 'Escape List',
            comment: 'First xel comment',
            dateCreated: '2016-09-14',
            expired: false,
            active: true,
          },
          {
            alertCode: 'XEL',
            alertCodeDescription: 'Escape List',
            comment: `
Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text
comment with lengthy text comment with lengthy text comment with lengthy text
comment with lengthy text comment with lengthy text comment with lengthy text
comment with lengthy text comment with lengthy text comment with lengthy text
`,
            dateCreated: '2016-09-15',
            expired: true,
            active: false,
          },
        ],
        escapeRiskAlerts: [
          {
            alertCode: 'XER',
            alertCodeDescription: 'Escape Risk',
            comment: 'First xer comment',
            dateCreated: '2016-09-16',
            expired: false,
            active: true,
          },
        ],
      },
    },
  })

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

const stubGetProfileWomenEscapeAlert = ({
  offenderNo,
  category,
  onEscapeList,
  activeOnEscapeList,
}: {
  offenderNo: string
  category: string
  onEscapeList: boolean
  activeOnEscapeList: boolean
}): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      url: `/risk-profiler/risk-profile/escape/${offenderNo}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        nomsId: offenderNo,
        riskType: 'ESCAPE',
        provisionalCategorisation: category,
        activeEscapeList: onEscapeList,
        activeEscapeRisk: activeOnEscapeList,
        escapeListAlerts: [
          {
            alertCode: 'XEL',
            alertCodeDescription: 'Escape List',
            comment: 'First xel comment',
            dateCreated: '2016-09-14',
            expired: false,
            active: true,
          },
          {
            alertCode: 'XEL',
            alertCodeDescription: 'Escape List',
            comment: `Second xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text
comment with lengthy text comment with lengthy text comment with lengthy text
comment with lengthy text comment with lengthy text comment with lengthy text
comment with lengthy text comment with lengthy text comment with lengthy text
`,
            dateCreated: '2016-09-15',
            expired: true,
            active: false,
          },
        ],
        escapeRiskAlerts: [
          {
            alertCode: 'XER',
            alertCodeDescription: 'Escape Risk',
            comment: 'First xer comment',
            dateCreated: '2016-09-16',
            expired: false,
            active: true,
          },
        ],
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
  stubGetEscapeProfile,
  stubGetExtremismProfile,
  stubGetSocProfile,
  stubGetProfileWomenEscapeAlert,
  stubRiskProfilerPing,
}
