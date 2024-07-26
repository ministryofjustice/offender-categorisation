type Recategorisation = {
  id: number
  booking_id: number
  status: string
  sequence_no: number
}

const createRecat = ({ id, booking_id, status, sequence_no }: Recategorisation) => ({
  id,
  form_response: { recat: { decision: { category: 'B' }, securityInput: null }, supervisor: { review: null } },
  booking_id,
  user_id: 'null',
  status,
  assigned_user_id: 'RECATEGORISER_USER',
  referred_date: null,
  referred_by: 'null',
  sequence_no,
  risk_profile: {},
  prison_id: 'LEI',
  offender_no: 'B0011XY',
  start_date: '2019-07-01 00:00:00.000000 +00:00',
  security_reviewed_by: 'null',
  security_reviewed_date: null,
  approval_date: null,
  cat_type: 'RECAT',
  nomis_sequence_no: null,
  assessment_date: '2019-07-22',
  approved_by: null,
  assessed_by: null,
  review_reason: 'DUE',
  due_by_date: '2019-08-03',
  cancelled_date: null,
  cancelled_by: null,
})

export default function mensUnapprovedInitialCategorisationSeedData() {
  // still 'good enough' not to delete
  const approvedRecatMissingApprovalDate = {
    ...createRecat({ id: -20010, booking_id: 20000, status: 'SECURITY_BACK', sequence_no: 11 }),
    approval_date: '2024-02-02 09:04:15.600000 +00:00',
  }

  // still 'good enough' not to delete
  const approvedRecatMissingApprovedBy = {
    ...createRecat({ id: -20011, booking_id: 20000, status: 'SECURITY_FLAGGED', sequence_no: 12 }),
    approved_by: 'SOME_VALUE_HERE',
  }

  return [
    createRecat({ id: -20000, booking_id: 20000, status: 'UNCATEGORISED', sequence_no: 1 }),
    createRecat({ id: -20001, booking_id: 20000, status: 'STARTED', sequence_no: 2 }),
    createRecat({ id: -20002, booking_id: 20000, status: 'SECURITY_MANUAL', sequence_no: 3 }),
    createRecat({ id: -20003, booking_id: 20000, status: 'SECURITY_AUTO', sequence_no: 4 }),
    createRecat({ id: -20004, booking_id: 20000, status: 'SECURITY_FLAGGED', sequence_no: 5 }),
    createRecat({ id: -20005, booking_id: 20000, status: 'SECURITY_BACK', sequence_no: 6 }),
    createRecat({ id: -20006, booking_id: 20000, status: 'AWAITING_APPROVAL', sequence_no: 7 }),
    createRecat({ id: -20007, booking_id: 20000, status: 'APPROVED', sequence_no: 8 }),
    createRecat({ id: -20008, booking_id: 20000, status: 'SUPERVISOR_BACK', sequence_no: 9 }),
    createRecat({ id: -20009, booking_id: 20000, status: 'CANCELLED', sequence_no: 10 }),
    approvedRecatMissingApprovalDate,
    approvedRecatMissingApprovedBy,
  ]
}
