export default (categoryDecision = 'R') => [
  {
    id: -1,
    form_response: {
      ratings: {
        decision: { category: categoryDecision },
        escapeRating: { escapeOtherEvidence: 'No' },
        securityInput: { securityInputNeeded: 'No' },
        nextReviewDate: { date: '14/12/2019' },
        violenceRating: { seriousThreat: 'No', highRiskOfViolence: 'No' },
        extremismRating: { previousTerrorismOffences: 'Yes' },
        offendingHistory: { previousConvictions: 'No' },
      },
      categoriser: { provisionalCategory: { suggestedCategory: categoryDecision, categoryAppropriate: 'Yes' } },
    },
    booking_id: 700,
    user_id: 'null',
    status: 'AWAITING_APPROVAL',
    assigned_user_id: 'FEMALE_USER',
    referred_date: null,
    referred_by: 'null',
    sequence_no: 1,
    risk_profile: {
      history: { catType: 'No CatA', finalCat: 'Cat R' },
      offences: [
        { bookingId: 700, offenceDate: '2019-02-21', offenceDescription: 'Libel' },
        { bookingId: 700, offenceDate: '2019-02-22', offenceRangeDate: '2019-02-24', offenceDescription: 'Slander' },
        { bookingId: 700, offenceDescription: 'Undated offence' },
      ],
    },
    prison_id: 'PFI',
    offender_no: 'dummy',
    start_date: '2023-05-23 15:24:57.820000 +00:00',
    security_reviewed_by: 'null',
    security_reviewed_date: null,
    approval_date: null,
    cat_type: 'INITIAL',
    nomis_sequence_no: 5,
    assessment_date: null,
    approved_by: null,
    assessed_by: null,
    review_reason: 'DUE',
    due_by_date: null,
    cancelled_date: null,
    cancelled_by: null,
  },
]
