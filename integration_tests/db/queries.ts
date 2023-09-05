import { mergeRight } from 'ramda'
import db from '../../server/data/dataAccess/db'
import { QueryArrayResult } from 'pg'

export type CatType = 'INITIAL' | 'RECAT'
export type ReviewReason = 'DUE' | 'AGE' | 'MANUAL' | 'RISK_CHANGE'

type MandatoryRowData = Pick<
  FormDbRow,
  'id' | 'bookingId' | 'sequenceNumber' | 'prisonId' | 'offenderNo' | 'startDate' | 'catType' | 'reviewReason'
>

export interface FormDbRow {
  id: number
  formResponse: string | null
  bookingId: number
  userId: string | null
  status: string | null
  assignedUserId: string | null
  referredDate: Date | null
  referredBy: string | null
  sequenceNumber: number
  riskProfile: string | null
  prisonId: string
  offenderNo: string
  startDate: string
  securityReviewedBy: string | null
  securityReviewedDate: Date | null
  approvalDate: Date | null
  catType: CatType
  nomisSequenceNumber: number | null
  assessmentDate: Date | null
  approvedBy: string | null
  assessedBy: string | null
  reviewReason: ReviewReason
  dueByDate: Date | null
  cancelledDate: Date | null
  cancelledBy: string | null
}

export interface NextReviewChangeHistoryDbRow {
  id: number
  booking_id: number
  offender_no: string
  next_review_date: string
  reason: string
  change_date: string
  changed_by: string
}

const defaultRowData: Partial<FormDbRow> = {
  formResponse: null,
  userId: null,
  status: null,
  assignedUserId: null,
  referredDate: null,
  referredBy: null,
  riskProfile: null,
  securityReviewedBy: null,
  securityReviewedDate: null,
  approvalDate: null,
  nomisSequenceNumber: null,
  assessmentDate: null,
  approvedBy: null,
  assessedBy: null,
  reviewReason: 'DUE',
  dueByDate: null,
  cancelledDate: null,
  cancelledBy: null,
}

async function insertFormTableDbRow(rowData: MandatoryRowData & Partial<FormDbRow>) {
  const {
    id,
    formResponse,
    bookingId,
    userId,
    status,
    assignedUserId,
    referredDate,
    referredBy,
    sequenceNumber,
    riskProfile,
    prisonId,
    offenderNo,
    startDate,
    securityReviewedBy,
    securityReviewedDate,
    approvalDate,
    catType,
    nomisSequenceNumber,
    assessmentDate,
    approvedBy,
    assessedBy,
    reviewReason,
    dueByDate,
    cancelledDate,
    cancelledBy,
  } = mergeRight(defaultRowData, rowData)

  const approvalDateDB = approvalDate !== null ? approvalDate : status === 'APPROVED' ? new Date(Date.now()) : null
  const approvedByDB = approvedBy !== null ? approvedBy : status === 'APPROVED' ? 'SUPERVISOR_USER' : null

  return await db.query(
    `INSERT INTO form ( id
                      , form_response
                      , booking_id
                      , user_id
                      , status
                      , assigned_user_id
                      , referred_date
                      , referred_by
                      , sequence_no
                      , risk_profile
                      , prison_id
                      , offender_no
                      , start_date
                      , security_reviewed_by
                      , security_reviewed_date
                      , approval_date
                      , cat_type
                      , nomis_sequence_no
                      , assessment_date
                      , approved_by
                      , assessed_by
                      , review_reason
                      , due_by_date
                      , cancelled_date,
                        cancelled_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
    [
      id,
      formResponse,
      bookingId,
      userId,
      status,
      assignedUserId,
      referredDate,
      referredBy,
      sequenceNumber,
      riskProfile,
      prisonId,
      offenderNo,
      startDate,
      securityReviewedBy,
      securityReviewedDate,
      approvalDateDB,
      catType,
      nomisSequenceNumber,
      assessmentDate,
      approvedByDB,
      assessedBy,
      reviewReason,
      dueByDate,
      cancelledDate,
      cancelledBy,
    ]
  )
}

async function insertSecurityReferralTableDbRow({
  offenderNumber,
  prisonId = 'LEI',
  id = -1,
  status = 'NEW',
}: {
  offenderNumber: FormDbRow['offenderNo']
  prisonId: FormDbRow['prisonId']
  id: FormDbRow['id']
  status: FormDbRow['status']
}) {
  return await db.query(
    `insert into security_referral (id, offender_no, user_id, prison_id, status, raised_date) values ($1, $2, $3, $4, $5, $6)`,
    [id, offenderNumber, 'SECURITY_USER', prisonId, status, new Date()]
  )
}

async function selectFormTableDbRow({
  bookingId,
}: {
  bookingId: FormDbRow['bookingId']
}): Promise<QueryArrayResult<FormDbRow[]>> {
  return await db.query(`select * from form where booking_id = $1 order by sequence_no`, [bookingId])
}

async function selectNextReviewChangeHistoryTableDbRow({
  offenderNo,
}: {
  offenderNo: NextReviewChangeHistoryDbRow['offender_no']
}): Promise<QueryArrayResult<NextReviewChangeHistoryDbRow[]>> {
  return await db.query(`select * from next_review_change_history where offender_no = $1`, [offenderNo])
}

async function updateRiskProfile({
  riskProfile,
  bookingId,
}: {
  riskProfile: FormDbRow['riskProfile']
  bookingId: FormDbRow['bookingId']
}) {
  return await db.query(`update form set risk_profile = $1::JSON where booking_id = $2`, [riskProfile, bookingId])
}

export default {
  insertFormTableDbRow,
  insertSecurityReferralTableDbRow,
  selectFormTableDbRow,
  selectNextReviewChangeHistoryTableDbRow,
  updateRiskProfile,
}
