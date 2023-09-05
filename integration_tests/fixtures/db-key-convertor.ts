import { CatType, FormDbRow, ReviewReason } from '../db/queries'

export interface FormDbJson {
  id: number
  form_response: any
  booking_id: number
  user_id: string | null
  status: string | null
  assigned_user_id: string | null
  referred_date: string | null
  referred_by: string | null
  sequence_no: number
  risk_profile: any
  prison_id: string
  offender_no: string
  start_date: string
  security_reviewed_by: string | null
  security_reviewed_date: string | null
  approval_date: string | null
  cat_type: string
  nomis_sequence_no: number | null
  assessment_date: string | null
  approved_by: string | null
  assessed_by: string | null
  review_reason: string
  due_by_date: string | null
  cancelled_date: string | null
  cancelled_by: string | null
}

/**
 * To speed up the migration from Groovy to Cypress, the Groovy setup data was
 * exported as JSON objects, rather than recreating the objects via code.
 *
 * This function converts the JSON keys as used in the database (snake_case)
 * to the key format we use in TypeScript (camelCase).
 *
 * @param formJson
 */
export const dbKeyConvertor = (formJson: FormDbJson): FormDbRow => {
  const {
    form_response,
    booking_id,
    user_id,
    assigned_user_id,
    referred_date,
    referred_by,
    sequence_no,
    risk_profile,
    prison_id,
    offender_no,
    start_date,
    security_reviewed_by,
    security_reviewed_date,
    approval_date,
    cat_type,
    nomis_sequence_no,
    assessment_date,
    approved_by,
    assessed_by,
    review_reason,
    due_by_date,
    cancelled_date,
    cancelled_by,
    ...rest
  } = formJson

  const dateOrNull = value => (typeof value === 'string' ? new Date(value) : null)

  return {
    ...rest,
    formResponse: form_response,
    bookingId: booking_id,
    userId: user_id,
    assignedUserId: assigned_user_id,
    referredDate: dateOrNull(referred_date),
    referredBy: referred_by,
    sequenceNumber: sequence_no,
    riskProfile: risk_profile,
    prisonId: prison_id,
    offenderNo: offender_no,
    startDate: start_date,
    securityReviewedBy: security_reviewed_by,
    securityReviewedDate: dateOrNull(security_reviewed_date),
    approvalDate: dateOrNull(approval_date),
    catType: cat_type as CatType,
    nomisSequenceNumber: nomis_sequence_no,
    assessmentDate: dateOrNull(assessment_date),
    approvedBy: approved_by,
    assessedBy: assessed_by,
    reviewReason: review_reason as ReviewReason,
    dueByDate: dateOrNull(due_by_date),
    cancelledDate: dateOrNull(cancelled_date),
    cancelledBy: cancelled_by,
  }
}

export default dbKeyConvertor
