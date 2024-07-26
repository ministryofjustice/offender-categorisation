import { LiteCategoryDbRow } from '../../db/queries'

type LiteCat = {
  booking_id: number
  sequence: number
}

const createLiteCategorisation = ({ booking_id, sequence }: LiteCat): LiteCategoryDbRow => ({
  booking_id,
  sequence,
  category: 'V',
  supervisor_category: null,
  offender_no: 'B2345YZ',
  prison_id: 'LEI',
  created_date: '2023-06-26 09:04:15.600000 +00:00',
  approved_date: null,
  assessed_by: 'CATEGORISER_USER',
  approved_by: null,
  assessment_committee: '',
  assessment_comment: null,
  next_review_date: '2024-06-26 09:04:15.600000 +00:00',
  placement_prison_id: null,
  approved_committee: null,
  approved_placement_prison_id: null,
  approved_placement_comment: null,
  approved_comment: null,
  approved_category_comment: null,
})

export default function mensUnapprovedLiteCategorisationSeedData(): LiteCategoryDbRow[] {
  const approvedLiteCat = {
    ...createLiteCategorisation({ booking_id: 30000, sequence: 3 }),
    approved_by: 'FAKE_TEST',
    approved_date: '2024-01-01 09:04:15.600000 +00:00',
  }

  // still 'good enough' not to delete
  const approvedLiteCatMissingApprovedDate = {
    ...createLiteCategorisation({ booking_id: 30000, sequence: 4 }),
    approved_date: '2024-02-02 09:04:15.600000 +00:00',
  }

  // still 'good enough' not to delete
  const approvedLiteCatMissingApprovalBy = {
    ...createLiteCategorisation({ booking_id: 30000, sequence: 6 }),
    approved_by: 'JOE_JONES',
  }

  return [
    createLiteCategorisation({ booking_id: 30000, sequence: 1 }),
    createLiteCategorisation({ booking_id: 30000, sequence: 2 }),
    approvedLiteCat,
    approvedLiteCatMissingApprovedDate,
    createLiteCategorisation({ booking_id: 30000, sequence: 5 }),
    approvedLiteCatMissingApprovalBy,
  ]
}
