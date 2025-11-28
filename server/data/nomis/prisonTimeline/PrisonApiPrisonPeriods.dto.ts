export interface PrisonApiPrisonPeriodsDto {
  prisonerNumber: string
  prisonPeriod?: {
    bookingId: number
    movementDates: {
      dateInToPrison: string | undefined
    }
  }[]
}
