import moment from 'moment'
import { LiteCategoryDbRow } from '../../db/queries'

export const supervisorViewSeedData: LiteCategoryDbRow[] = [
  {
    booking_id: 12,
    sequence: 1,
    category: 'V',
    supervisor_category: null,
    offender_no: 'B2345YZ',
    prison_id: 'LEI',
    created_date: '2023-06-23 13:45:49.776453 +00:00',
    approved_date: null,
    assessed_by: 'CATEGORISER_USER',
    approved_by: null,
    assessment_committee: 'RECP',
    assessment_comment: 'comment',
    next_review_date: moment().add(6, 'months').toISOString(),
    placement_prison_id: 'BXI',
    approved_committee: null,
    approved_placement_prison_id: null,
    approved_placement_comment: null,
    approved_comment: null,
    approved_category_comment: null,
  },
]
