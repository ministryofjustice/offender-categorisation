import { mergeRight } from 'ramda'
import { QueryArrayResult } from 'pg'
import db from '../../server/data/dataAccess/db'

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

export interface LiteCategoryDbRow {
  booking_id: number
  sequence: number
  category: string
  supervisor_category: string
  offender_no: string
  prison_id: string
  created_date: string
  approved_date: string
  assessed_by: string
  approved_by: string
  assessment_committee: string
  assessment_comment: string
  next_review_date: string
  placement_prison_id: string
  approved_committee: string
  approved_placement_prison_id: string
  approved_placement_comment: string
  approved_comment: string
  approved_category_comment: string
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

export interface SecurityReferralDbRow {
  offender_no: string
  status: string
  prison_id: string
  user_id: string
  raised_date: string
}

export interface RiskChangeDbRow {
  id: number
  oldProfile: string
  newProfile: string
  offender_no: string
  user_id: string
  prison_id: string
  status: string
  raised_date: string
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

  // eslint-disable-next-line no-nested-ternary
  const approvalDateDB = approvalDate !== null ? approvalDate : status === 'APPROVED' ? new Date(Date.now()) : null
  // eslint-disable-next-line no-nested-ternary
  const approvedByDB = approvedBy !== null ? approvedBy : status === 'APPROVED' ? 'SUPERVISOR_USER' : null

  return db.query(
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
    ],
  )
}

async function insertLiteCategoryTableDbRow({
  booking_id,
  sequence,
  category,
  supervisor_category,
  offender_no,
  prison_id,
  created_date,
  approved_date,
  assessed_by,
  approved_by,
  assessment_committee,
  assessment_comment,
  next_review_date,
  placement_prison_id,
  approved_committee,
  approved_placement_prison_id,
  approved_placement_comment,
  approved_comment,
}: LiteCategoryDbRow) {
  return db.query(
    `insert into lite_category (  booking_id,
                                      sequence,
                                      category,
                                      supervisor_category,
                                      offender_no,
                                      prison_id,
                                      created_date,
                                      approved_date,
                                      assessed_by,
                                      approved_by,
                                      assessment_committee,
                                      assessment_comment,
                                      next_review_date,
                                      placement_prison_id,
                                      approved_committee,
                                      approved_placement_prison_id,
                                      approved_placement_comment,
                                      approved_comment) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
    [
      booking_id,
      sequence,
      category,
      supervisor_category,
      offender_no,
      prison_id,
      created_date,
      approved_date,
      assessed_by,
      approved_by,
      assessment_committee,
      assessment_comment,
      next_review_date,
      placement_prison_id,
      approved_committee,
      approved_placement_prison_id,
      approved_placement_comment,
      approved_comment,
    ],
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
  return db.query(
    `insert into security_referral (id, offender_no, user_id, prison_id, status, raised_date) values ($1, $2, $3, $4, $5, $6)`,
    [id, offenderNumber, 'SECURITY_USER', prisonId, status, new Date()],
  )
}

async function insertRiskChangeTableDbRow({
  offenderNumber,
  prisonId,
  status,
  oldRiskProfileJson = '{}',
  newRiskProfileJson = '{}',
  raisedDate = new Date(),
}: {
  offenderNumber: string
  prisonId: string
  status: string
  oldRiskProfileJson: string
  newRiskProfileJson: string
  raisedDate: Date
}) {
  return db.query(
    `insert into risk_change (old_profile, new_profile, offender_no, user_id, prison_id, status, raised_date) values ($1, $2, $3, $4, $5, $6, $7)`,
    [oldRiskProfileJson, newRiskProfileJson, offenderNumber, 'SECURITY_USER', prisonId, status, raisedDate],
  )
}

async function getLiteData({
  bookingId,
}: {
  bookingId: LiteCategoryDbRow['booking_id']
}): Promise<QueryArrayResult<LiteCategoryDbRow[]>> {
  return db.query(`select * from lite_category where booking_id = $1 order by sequence`, [bookingId])
}

async function selectFormTableDbRow({
  bookingId,
}: {
  bookingId: FormDbRow['bookingId']
}): Promise<QueryArrayResult<FormDbRow[]>> {
  return db.query(`select * from form where booking_id = $1 order by sequence_no`, [bookingId])
}

async function selectLiteCategoryTableDbRow({
  bookingId,
}: {
  bookingId: LiteCategoryDbRow['booking_id']
}): Promise<QueryArrayResult<LiteCategoryDbRow[]>> {
  return db.query(`select * from lite_category where booking_id = $1 order by sequence`, [bookingId])
}

async function selectNextReviewChangeHistoryTableDbRow({
  offenderNo,
}: {
  offenderNo: NextReviewChangeHistoryDbRow['offender_no']
}): Promise<QueryArrayResult<NextReviewChangeHistoryDbRow[]>> {
  return db.query(`select * from next_review_change_history where offender_no = $1`, [offenderNo])
}

async function selectRiskChangeTableDbRow({
  offenderNo,
}: {
  offenderNo: FormDbRow['offenderNo']
}): Promise<QueryArrayResult<RiskChangeDbRow[]>> {
  return db.query(`select * from risk_change where offender_no = $1`, [offenderNo])
}

async function updateRiskProfile({
  riskProfile,
  bookingId,
}: {
  riskProfile: FormDbRow['riskProfile']
  bookingId: FormDbRow['bookingId']
}) {
  return db.query(`update form set risk_profile = $1::JSON where booking_id = $2`, [riskProfile, bookingId])
}

const updateFormRecord = async ({
  bookingId,
  status,
  formResponse,
}: {
  bookingId: number
  status: string
  formResponse: any
}) => {
  const existingFormResponse = await db.query(`select form_response from form where booking_id = $1`, [bookingId])
  return db.query(`update form set status = $1, form_response = $2 where booking_id = $3`, [
    status,
    mergeRight(existingFormResponse.rows[0]?.form_response, formResponse),
    bookingId,
  ])
}

const deleteRowsFromForm = () => db.query({ text: 'truncate form cascade' })
const deleteRowsFromSecurityReferral = () => db.query({ text: 'truncate security_referral cascade' })

const getSecurityReferral = async ({ offenderNumber }: { offenderNumber: string }) => {
  return db.query(`select * from security_referral where offender_no = $1`, [offenderNumber])
}

const updateNomisSequenceNumber = async ({
  bookingId,
  sequenceNumber,
  nomisSequenceNumber,
}: {
  bookingId: number
  sequenceNumber: number
  nomisSequenceNumber: number
}) => {
  return db.query(
    `
      update form
      set nomis_sequence_no = $1
      where booking_id = $2
      and sequence_no = $3
    `,
    [nomisSequenceNumber, bookingId, sequenceNumber],
  )
}

export default {
  insertFormTableDbRow,
  insertLiteCategoryTableDbRow,
  insertSecurityReferralTableDbRow,
  insertRiskChangeTableDbRow,
  getLiteData,
  selectFormTableDbRow,
  selectLiteCategoryTableDbRow,
  selectNextReviewChangeHistoryTableDbRow,
  selectRiskChangeTableDbRow,
  updateRiskProfile,
  updateFormRecord,
  deleteRowsFromForm,
  deleteRowsFromSecurityReferral,
  getSecurityReferral,
  updateNomisSequenceNumber,
}
