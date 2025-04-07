import { NomisAdjudicationHearingDto } from './nomisAdjudicationHearing.dto'

const makeTestNomisAdjudicationHearingDto = (
  nomisAdjudicationHearingDto: Partial<NomisAdjudicationHearingDto> = {},
): NomisAdjudicationHearingDto => ({
  agencyId: nomisAdjudicationHearingDto.agencyId ?? 'ABC',
  offenderNo: nomisAdjudicationHearingDto.offenderNo ?? 'ABC123',
  hearingId: nomisAdjudicationHearingDto.hearingId ?? 12345,
  hearingType: nomisAdjudicationHearingDto.hearingType ?? "Governor's Hearing Adult",
  startTime: nomisAdjudicationHearingDto.startTime ?? '2024-01-01',
  internalLocationId: nomisAdjudicationHearingDto.internalLocationId ?? 123,
  internalLocationDescription: nomisAdjudicationHearingDto.internalLocationDescription ?? 'PVI-RES-MCASU-ADJUD',
  eventStatus: nomisAdjudicationHearingDto.eventStatus ?? 'COMP',
})

export default makeTestNomisAdjudicationHearingDto
