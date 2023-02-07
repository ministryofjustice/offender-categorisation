package uk.gov.justice.digital.hmpps.cattool.model

import groovy.transform.TupleConstructor

import static StaffMember.*
import static UserType.*
import static Caseload.*

@TupleConstructor
enum UserAccount {

    CATEGORISER_USER('CATEGORISER_USER', SM_2, GENERAL, LEI, [BXI, LEI, MDI, SYI, WAI], ['ROLE_CREATE_CATEGORISATION']),
    ITAG_USER_COLLEAGUE('CATEGORISER_USER', SM_3, GENERAL, LEI, [BXI, LEI, MDI, SYI, WAI], ['ROLE_CREATE_CATEGORISATION']),
    RECATEGORISER_USER('RECATEGORISER_USER', SM_6, GENERAL, LEI, [BXI, LEI, MDI, SYI, WAI], ['ROLE_CREATE_RECATEGORISATION']),
    SUPERVISOR_USER('SUPERVISOR_USER', SM_4, GENERAL, LEI, [BXI, LEI, MDI, SYI, WAI], ['ROLE_APPROVE_CATEGORISATION']),
    SECURITY_USER('SECURITY_USER', SM_5, GENERAL, LEI, [LEI], ['ROLE_CATEGORISATION_SECURITY']),
    READONLY_USER('READONLY_USER', SM_5, GENERAL, LEI, [LEI], []),
    MULTIROLE_USER('MULTIROLE_USER', SM_5, GENERAL, LEI, [LEI], ['ROLE_APPROVE_CATEGORISATION', 'ROLE_CREATE_CATEGORISATION']),
    FEMALE_USER('FEMALE_USER', SM_11, GENERAL, PFI, [PFI, LNI, AGI], ['ROLE_CREATE_CATEGORISATION'])




    String username
    StaffMember staffMember
    UserType type
    Caseload workingCaseload
    List<Caseload> caseloads
    List<String> roles
}
