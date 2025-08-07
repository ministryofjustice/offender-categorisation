import { AdjudicationsDto } from './adjudications.dto'

export const makeTestAdjudicationsDto = (adjudicationsDto: Partial<AdjudicationsDto> = {}): AdjudicationsDto => ({
  bookingId: adjudicationsDto.bookingId ?? 123,
  adjudicationCount: adjudicationsDto.adjudicationCount ?? 2,
})
