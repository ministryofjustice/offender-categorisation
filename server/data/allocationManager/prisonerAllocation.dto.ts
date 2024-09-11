import { AllocatedPomDto } from './allocatedPom.dto'

export interface PrisonerAllocationDto {
  primary_pom: AllocatedPomDto | undefined
  secondary_pom: AllocatedPomDto | undefined
}
