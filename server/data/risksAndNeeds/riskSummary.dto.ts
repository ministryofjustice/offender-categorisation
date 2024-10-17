export enum OverallRiskLevel {
  low = 'LOW',
  medium = 'MEDIUM',
  high = 'HIGH',
  veryHigh = 'VERY_HIGH',
}

export interface RiskSummaryDto {
  overallRiskLevel: OverallRiskLevel
}
