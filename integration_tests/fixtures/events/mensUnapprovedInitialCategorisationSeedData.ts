type Categorisation = {
  id: number
  booking_id: number
  status: string
  sequence_no: number
}

const createInitialCat = ({ id, booking_id, status, sequence_no }: Categorisation) => ({
  id,
  form_response: {
    ratings: { securityInput: null },
    supervisor: { review: null },
    categoriser: { provisionalCategory: { suggestedCategory: 'C', overriddenCategory: null } },
  },
  booking_id,
  user_id: 'null',
  status,
  assigned_user_id: 'CATEGORISER_USER',
  referred_date: null,
  referred_by: 'null',
  sequence_no,
  risk_profile: {},
  prison_id: 'LEI',
  offender_no: 'B0010XY',
  start_date: '2019-07-01 00:00:00.000000 +00:00',
  security_reviewed_by: 'null',
  security_reviewed_date: null,
  approval_date: null,
  cat_type: 'INITIAL',
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
  const approvedCatMissingApprovalDate = {
    ...createInitialCat({ id: -10010, booking_id: 10000, status: 'UNCATEGORISED', sequence_no: 11 }),
    approval_date: '2024-02-02 09:04:15.600000 +00:00',
  }

  // still 'good enough' not to delete
  const approvedCatMissingApprovedBy = {
    ...createInitialCat({ id: -10011, booking_id: 10000, status: 'SUPERVISOR_BACK', sequence_no: 12 }),
    approved_by: 'SOME_VALUE_HERE',
  }

  return [
    createInitialCat({ id: -10000, booking_id: 10000, status: 'UNCATEGORISED', sequence_no: 1 }),
    createInitialCat({ id: -10001, booking_id: 10000, status: 'STARTED', sequence_no: 2 }),
    createInitialCat({ id: -10002, booking_id: 10000, status: 'SECURITY_MANUAL', sequence_no: 3 }),
    createInitialCat({ id: -10003, booking_id: 10000, status: 'SECURITY_AUTO', sequence_no: 4 }),
    createInitialCat({ id: -10004, booking_id: 10000, status: 'SECURITY_FLAGGED', sequence_no: 5 }),
    createInitialCat({ id: -10005, booking_id: 10000, status: 'SECURITY_BACK', sequence_no: 6 }),
    createInitialCat({ id: -10006, booking_id: 10000, status: 'AWAITING_APPROVAL', sequence_no: 7 }),
    createInitialCat({ id: -10007, booking_id: 10000, status: 'APPROVED', sequence_no: 8 }),
    createInitialCat({ id: -10008, booking_id: 10000, status: 'SUPERVISOR_BACK', sequence_no: 9 }),
    createInitialCat({ id: -10009, booking_id: 10000, status: 'CANCELLED', sequence_no: 10 }),
    approvedCatMissingApprovalDate,
    approvedCatMissingApprovedBy,
  ]
}
