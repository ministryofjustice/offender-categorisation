import moment from 'moment'
import { LiteCategoryDbRow } from '../../db/queries'

export const unapprovedLiteCategorisation: LiteCategoryDbRow[] = [
  {
    booking_id: 12,
    sequence: 1,
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
    next_review_date: moment().add(6, 'months').startOf('day').toISOString(),
    placement_prison_id: null,
    approved_committee: null,
    approved_placement_prison_id: null,
    approved_placement_comment: null,
    approved_comment: null,
    approved_category_comment: null,
  },
]
