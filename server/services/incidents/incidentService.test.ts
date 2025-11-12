import { getCountOfRecentAssaultsAndSeriousAssaultsFromAssaultIncidents } from './incidentService'
import { makeTestCountOfAssaultIncidents } from './countOfAssaultIncidents.test-factory'
import {
  makeTestNomisIncidentDto,
  makeTestNomisIncidentDtoResponse,
} from '../../data/nomis/incidents/nomisIncident.dto.test-factory'

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2025-02-01'))
})

describe('getCountOfRecentAssaultsAndSeriousAssaultsFromAssaultIncidents', () => {
  it('returns count of recent assaults and serious assaults from assault incidents when there are no incidents', () => {
    expect(getCountOfRecentAssaultsAndSeriousAssaultsFromAssaultIncidents([])).toEqual(
      makeTestCountOfAssaultIncidents({
        countOfAssaults: 0,
        countOfRecentSeriousAssaults: 0,
        countOfRecentNonSeriousAssaults: 0,
      }),
    )
  })

  it('returns count of recent assaults and serious assaults from assault incidents with mix of incidents incidents', () => {
    expect(
      getCountOfRecentAssaultsAndSeriousAssaultsFromAssaultIncidents([
        makeTestNomisIncidentDto({
          incidentStatus: 'SOMETHING',
          reportTime: '2025-01-01',
          responses: [
            makeTestNomisIncidentDtoResponse({
              question: 'Something',
              answer: 'No',
            }),
          ],
        }),
        makeTestNomisIncidentDto({
          incidentStatus: 'DUP',
          reportTime: '2025-01-01',
          responses: [
            makeTestNomisIncidentDtoResponse({
              question: 'Something',
              answer: 'No',
            }),
          ],
        }),
        makeTestNomisIncidentDto({
          incidentStatus: 'SOMETHING',
          reportTime: '2025-01-01',
          responses: [
            makeTestNomisIncidentDtoResponse({
              question: 'WAS THIS A SEXUAL ASSAULT',
              answer: 'YES',
            }),
          ],
        }),
        makeTestNomisIncidentDto({
          incidentStatus: 'SOMETHING',
          reportTime: '2024-01-30',
          responses: [
            makeTestNomisIncidentDtoResponse({
              question: 'Something',
              answer: 'YES',
            }),
          ],
        }),
      ]),
    ).toEqual(
      makeTestCountOfAssaultIncidents({
        countOfAssaults: 3,
        countOfRecentSeriousAssaults: 1,
        countOfRecentNonSeriousAssaults: 1,
      }),
    )
  })
})
