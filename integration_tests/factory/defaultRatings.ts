const B = {
  offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'some convictions' },
  securityInput: { securityInputNeeded: 'No' },
  furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'some charges' },
  violenceRating: { highRiskOfViolence: 'No', seriousThreat: 'Yes' },
  escapeRating: {
    escapeOtherEvidence: 'Yes',
    escapeOtherEvidenceText: 'evidence details',
    escapeCatB: 'Yes',
    escapeCatBText: 'cat b details',
  },
  extremismRating: { previousTerrorismOffences: 'Yes' },
  nextReviewDate: { date: '14/12/2019' },
}

const C = {
  offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'some convictions' },
  securityInput: { securityInputNeeded: 'No' },
  furtherCharges: { furtherCharges: 'No' },
  violenceRating: { highRiskOfViolence: 'No', seriousThreat: 'No' },
  escapeRating: { escapeOtherEvidence: 'No' },
  extremismRating: { previousTerrorismOffences: 'No' },
  nextReviewDate: { date: '14/12/2019' },
}

const CLOSED = {
  decision: { category: 'R' },
  offendingHistory: { previousConvictions: 'No' },
  securityInput: { securityInputNeeded: 'No' },
  violenceRating: { highRiskOfViolence: 'No', seriousThreat: 'No' },
  escapeRating: { escapeOtherEvidence: 'No' },
  extremismRating: { previousTerrorismOffences: 'Yes' },
  nextReviewDate: { date: '14/12/2019' },
}

const YOI_CLOSED = {
  decision: { category: 'I' },
  offendingHistory: { previousConvictions: 'No' },
  securityInput: { securityInputNeeded: 'No' },
  violenceRating: { highRiskOfViolence: 'No', seriousThreat: 'No' },
  escapeRating: { escapeOtherEvidence: 'No' },
  extremismRating: { previousTerrorismOffences: 'Yes' },
  nextReviewDate: { date: '14/12/2019' },
}

const defaultRatingsFactory = (requestedRating: 'B' | 'C' | 'CLOSED' | 'YOI_CLOSED') => {
  switch (requestedRating) {
    case 'B':
      return B
    case 'C':
      return C
    case 'CLOSED':
      return CLOSED
    case 'YOI_CLOSED':
      return YOI_CLOSED
    default:
      throw new Error('Sorry, that is not a valid choice.')
  }
}

export default defaultRatingsFactory
