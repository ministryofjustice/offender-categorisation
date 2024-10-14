import { OVERALL_RISK_LEVEL_LOW, RiskSummaryDto } from './riskSummary.dto'

export const makeTestRiskSummaryDto = (riskSummaryDto: Partial<RiskSummaryDto> = {}): RiskSummaryDto => ({
  overallRiskLevel: riskSummaryDto.overallRiskLevel ?? OVERALL_RISK_LEVEL_LOW,
})

export default makeTestRiskSummaryDto
