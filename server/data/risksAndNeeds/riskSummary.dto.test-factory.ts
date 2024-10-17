import { OverallRiskLevel, RiskSummaryDto } from './riskSummary.dto'

export const makeTestRiskSummaryDto = (riskSummaryDto: Partial<RiskSummaryDto> = {}): RiskSummaryDto => ({
  overallRiskLevel: riskSummaryDto.overallRiskLevel ?? OverallRiskLevel.low,
})

export default makeTestRiskSummaryDto
