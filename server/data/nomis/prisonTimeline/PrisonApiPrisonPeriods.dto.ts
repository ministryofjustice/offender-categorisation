export interface PrisonApiPrisonPeriodsDto {
  prisonerNumber: string
  prisonPeriod:
    | {
        bookingNumber: string
        bookingId: number
        movementDates: {
          dateInToPrison: string | undefined
        }
      }[]
    | undefined
}
