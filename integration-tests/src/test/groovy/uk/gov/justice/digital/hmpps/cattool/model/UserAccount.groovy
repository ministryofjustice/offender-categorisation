package uk.gov.justice.digital.hmpps.cattool.model

import groovy.transform.TupleConstructor

import static StaffMember.*
import static UserType.*
import static Caseload.*

@TupleConstructor
enum UserAccount {

    CATEGORISER_USER('CATEGORISER_USER', SM_2, GENERAL, LEI, [BXI, LEI, MDI, SYI, WAI], ['ROLE_CREATE_CATEGORISATION']),
    ITAG_USER_COLLEAGUE('CATEGORISER_USER', SM_2, GENERAL, LEI, [BXI, LEI, MDI, SYI, WAI], ['ROLE_CREATE_CATEGORISATION']),
    SUPERVISOR_USER('SUPERVISOR_USER', SM_2, GENERAL, LEI, [BXI, LEI, MDI, SYI, WAI], ['ROLE_APPROVE_CATEGORISATION'])

    String username
    StaffMember staffMember
    UserType type
    Caseload workingCaseload
    List<Caseload> caseloads
    List<String> roles
}
