const ramda = require('ramda')
const prisons = require('./prisons')
const CatType = require('../../server/utils/catTypeEnum')
const Status = require('../../server/utils/statusEnum')

const fakePrisoner = (id, fields = {}) =>
  ramda.mergeDeepRight(
    {
      id,
      form_response: {
        ratings: {
          escapeRating: { escapeOtherEvidence: 'No' },
          securityInput: { securityInputNeeded: 'No' },
          furtherCharges: { furtherCharges: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          violenceRating: { seriousThreat: 'No', highRiskOfViolence: 'No' },
          extremismRating: { previousTerrorismOffences: 'No' },
          offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'some convictions' },
        },
        supervisor: {},
        categoriser: {},
        openConditions: {
          tprs: { tprsSelected: 'Yes' },
          riskLevels: { likelyToAbscond: 'No' },
          riskOfHarm: { seriousHarm: 'No' },
          furtherCharges: {
            increasedRisk: 'No',
            furtherCharges: 'Yes',
            furtherChargesText: ',furtherChargesText details',
          },
          sexualOffences: { haveTheyBeenEverConvicted: 'No' },
          foreignNational: { isForeignNational: 'No' },
          previousSentences: { releasedLastFiveYears: 'No' },
          earliestReleaseDate: { threeOrMoreYears: 'No' },
          victimContactScheme: { vcsOptedFor: 'No' },
        },
        openConditionsRequested: true,
      },
      booking_id: id,
      user_id: 'user123',
      status: Status.APPROVED.name,
      assigned_user_id: 'user456',
      referred_date: '2022-02-01T10:30:00Z',
      referred_by: 'referral123',
      sequence_no: id,
      risk_profile: {
        risk_factor1: true,
        risk_factor2: false,
        risk_factor3: true,
      },
      prison_id: prisons.ADULT.MENS.PETERBOROUGH,
      offender_no: `FAKE${id}`,
      start_date: '2022-01-01T12:00:00Z',
      security_reviewed_by: 'security123',
      security_reviewed_date: '2022-01-15T10:30:00Z',
      approval_date: '2022-01-24',
      cat_type: CatType.INITIAL.name,
      nomis_sequence_no: id,
      assessment_date: '2022-01-10',
      approved_by: 'approver123',
      assessed_by: 'assessor123',
      review_reason: 'MANUAL',
      due_by_date: '2022-02-28',
      cancelled_date: null,
      cancelled_by: null,
    },
    fields
  )

module.exports = {
  fakePrisoner,
}
