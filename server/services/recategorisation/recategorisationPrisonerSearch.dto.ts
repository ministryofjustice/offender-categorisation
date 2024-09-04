export interface RecategorisationPrisonerSearchDto {
  releaseDate: string | undefined
  alerts: PrisonerSearchAlertDto[] | undefined
  currentIncentive:
    | {
        level: {
          code: string
          description: string
        }
        dateTime: string
        nextReviewDate: string
      }
    | undefined
}
