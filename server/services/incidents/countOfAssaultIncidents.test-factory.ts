import { CountOfAssaultIncidents } from './countOfAssaultIncidents'

export const makeTestCountOfAssaultIncidents = (
  countOfAssaultIncidents: Partial<CountOfAssaultIncidents> = {},
): CountOfAssaultIncidents => ({
  countOfAssaults: countOfAssaultIncidents.countOfAssaults ?? 0,
  countOfRecentSeriousAssaults: countOfAssaultIncidents.countOfRecentSeriousAssaults ?? 0,
  countOfRecentNonSeriousAssaults: countOfAssaultIncidents.countOfRecentNonSeriousAssaults ?? 0,
})
