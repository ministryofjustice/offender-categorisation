import { getCountOfRecentAssaultsAndSeriousAssaults } from './incidentService'
import { makeTestCountOfAssaultIncidents } from './countOfAssaultIncidents.test-factory'
import {
  makeTestIncidentReport,
  makeTestQuestion,
  makeTestResponse,
} from '../../data/incidentReportingApi/incidentReport.dto.test-factory'
import { SERIOUS_ASSAULT_QUESTIONS } from '../../data/incidentReportingApi/incidentReport.dto'
import { IncidentReportingApiClient } from '../../data/incidentReportingApi/incidentReportingApiClient'

const prisonerNumber = 'A1234BC'

const makeClient = (overrides: Partial<IncidentReportingApiClient> = {}): IncidentReportingApiClient => ({
  getTotalNumberOfIncidents: jest.fn(),
  getIncidentIds: jest.fn(),
  getDetailedIncidentReport: jest.fn(),
  ...overrides,
})

describe('getCountOfRecentAssaultsAndSeriousAssaults', () => {
  it('returns zero counts and skips the detail calls when the total is zero', async () => {
    const getIncidentIds = jest.fn()
    const getDetailedIncidentReport = jest.fn()
    const client = makeClient({
      getTotalNumberOfIncidents: jest.fn().mockResolvedValue(0),
      getIncidentIds,
      getDetailedIncidentReport,
    })

    const result = await getCountOfRecentAssaultsAndSeriousAssaults(client, prisonerNumber)

    expect(result).toEqual(
      makeTestCountOfAssaultIncidents({
        countOfAssaults: 0,
        countOfRecentSeriousAssaults: 0,
        countOfRecentNonSeriousAssaults: 0,
      }),
    )
    expect(getIncidentIds).not.toHaveBeenCalled()
    expect(getDetailedIncidentReport).not.toHaveBeenCalled()
  })

  it('returns counts derived from the recent detailed reports', async () => {
    const seriousAssault = makeTestIncidentReport({
      id: '1',
      questions: [
        makeTestQuestion({
          question: SERIOUS_ASSAULT_QUESTIONS[0],
          responses: [makeTestResponse({ response: 'YES' })],
        }),
      ],
    })
    const nonSeriousAssault = makeTestIncidentReport({
      id: '2',
      questions: [
        makeTestQuestion({
          question: 'Some other question',
          responses: [makeTestResponse({ response: 'NO' })],
        }),
      ],
    })

    const client = makeClient({
      getTotalNumberOfIncidents: jest.fn().mockResolvedValue(5),
      getIncidentIds: jest.fn().mockResolvedValue(['1', '2']),
      getDetailedIncidentReport: jest
        .fn()
        .mockImplementation(id => Promise.resolve(id === '1' ? seriousAssault : nonSeriousAssault)),
    })

    const result = await getCountOfRecentAssaultsAndSeriousAssaults(client, prisonerNumber)

    expect(result).toEqual(
      makeTestCountOfAssaultIncidents({
        countOfAssaults: 5,
        countOfRecentSeriousAssaults: 1,
        countOfRecentNonSeriousAssaults: 1,
      }),
    )
    expect(client.getIncidentIds).toHaveBeenCalledWith(prisonerNumber, 12, 5)
  })

  it('counts an incident as serious when any serious question has a YES response', async () => {
    const incident = makeTestIncidentReport({
      id: '1',
      questions: [
        makeTestQuestion({
          question: 'Some non-serious question',
          responses: [makeTestResponse({ response: 'NO' })],
        }),
        makeTestQuestion({
          question: SERIOUS_ASSAULT_QUESTIONS[1].toLowerCase(),
          responses: [makeTestResponse({ response: 'yes' })],
        }),
      ],
    })

    const client = makeClient({
      getTotalNumberOfIncidents: jest.fn().mockResolvedValue(1),
      getIncidentIds: jest.fn().mockResolvedValue(['1']),
      getDetailedIncidentReport: jest.fn().mockResolvedValue(incident),
    })

    const result = await getCountOfRecentAssaultsAndSeriousAssaults(client, prisonerNumber)

    expect(result).toEqual(
      makeTestCountOfAssaultIncidents({
        countOfAssaults: 1,
        countOfRecentSeriousAssaults: 1,
        countOfRecentNonSeriousAssaults: 0,
      }),
    )
  })

  it('reports more total assaults than recent incidents when older incidents are excluded', async () => {
    const recentSeriousAssault = makeTestIncidentReport({
      id: '1',
      questions: [
        makeTestQuestion({
          question: SERIOUS_ASSAULT_QUESTIONS[0],
          responses: [makeTestResponse({ response: 'YES' })],
        }),
      ],
    })

    const client = makeClient({
      getTotalNumberOfIncidents: jest.fn().mockResolvedValue(7),
      getIncidentIds: jest.fn().mockResolvedValue(['1']),
      getDetailedIncidentReport: jest.fn().mockResolvedValue(recentSeriousAssault),
    })

    const result = await getCountOfRecentAssaultsAndSeriousAssaults(client, prisonerNumber)

    expect(result).toEqual(
      makeTestCountOfAssaultIncidents({
        countOfAssaults: 7,
        countOfRecentSeriousAssaults: 1,
        countOfRecentNonSeriousAssaults: 0,
      }),
    )
  })
})
