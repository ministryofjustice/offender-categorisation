import { CountOfAssaultIncidents } from './countOfAssaultIncidents'

export const makeTestCountOfAssaultIncidents = (
  countOfAssaultIncidents: Partial<CountOfAssaultIncidents> = {},
): CountOfAssaultIncidents => ({
  countOfAssaults: countOfAssaultIncidents.countOfAssaults ?? 0,
  countOfSeriousAssaults: countOfAssaultIncidents.countOfSeriousAssaults ?? 0,
  countOfNonSeriousAssaults: countOfAssaultIncidents.countOfNonSeriousAssaults ?? 0,
})
