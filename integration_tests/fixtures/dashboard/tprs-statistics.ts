const setupTprsStats = () => {
  ;[
    {
      id: -11,
      formResponse: { recat: { decision: { category: 'B' }, securityInput: null }, supervisor: { review: null } },
      bookingId: 11,
      userId: 'null',
      status: 'AWAITING_APPROVAL',
      assignedUserId: 'RECATEGORISER_USER',
      referredDate: null,
      referredBy: 'null',
      sequenceNumber: 1,
      riskProfile: {},
      prisonId: 'LEI',
      offenderNo: 'B0011XY',
      startDate: '2019-07-01 00:00:00.000000 +00:00',
      securityReviewedBy: 'null',
      securityReviewedDate: null,
      approvalDate: '2019-08-15',
      catType: 'RECAT',
      nomisSequenceNumber: null,
      assessmentDate: '2019-07-22',
      approvedBy: null,
      assessedBy: null,
      reviewReason: 'DUE',
      dueByDate: '2019-08-03',
      cancelledDate: null,
      cancelledBy: null,
    },
    {
      id: -30,
      formResponse: {
        recat: { decision: { category: 'C' }, securityInput: null },
        supervisor: { review: null },
        openConditions: { tprs: { tprsSelected: 'Yes' } },
      },
      bookingId: 30,
      userId: 'null',
      status: 'APPROVED',
      assignedUserId: 'RECATEGORISER_USER',
      referredDate: null,
      referredBy: 'null',
      sequenceNumber: 1,
      riskProfile: {},
      prisonId: 'LEI',
      offenderNo: 'B0030XY',
      startDate: '2019-07-01 00:00:00.000000 +00:00',
      securityReviewedBy: 'null',
      securityReviewedDate: null,
      approvalDate: '2019-08-05',
      catType: 'RECAT',
      nomisSequenceNumber: null,
      assessmentDate: '2019-07-22',
      approvedBy: 'SUPERVISOR_USER',
      assessedBy: null,
      reviewReason: 'DUE',
      dueByDate: '2019-08-03',
      cancelledDate: null,
      cancelledBy: null,
    },
    {
      id: -31,
      formResponse: {
        recat: { decision: { category: 'D' }, securityInput: null },
        supervisor: { review: null },
        openConditions: { tprs: { tprsSelected: 'Yes' } },
      },
      bookingId: 31,
      userId: 'null',
      status: 'APPROVED',
      assignedUserId: 'RECATEGORISER_USER',
      referredDate: null,
      referredBy: 'null',
      sequenceNumber: 1,
      riskProfile: {},
      prisonId: 'LEI',
      offenderNo: 'B0031XY',
      startDate: '2019-07-01 00:00:00.000000 +00:00',
      securityReviewedBy: 'null',
      securityReviewedDate: null,
      approvalDate: '2019-08-05',
      catType: 'RECAT',
      nomisSequenceNumber: null,
      assessmentDate: '2019-07-22',
      approvedBy: 'SUPERVISOR_USER',
      assessedBy: null,
      reviewReason: 'DUE',
      dueByDate: '2019-08-03',
      cancelledDate: null,
      cancelledBy: null,
    },
    {
      id: -32,
      formResponse: {
        recat: { decision: { category: 'D' }, securityInput: null },
        supervisor: {
          review: {
            proposedCategory: 'D',
            supervisorOverriddenCategory: 'C',
            supervisorCategoryAppropriate: 'No',
            supervisorOverriddenCategoryText: 'test',
          },
        },
        openConditions: { tprs: { tprsSelected: 'Yes' } },
      },
      bookingId: 32,
      userId: 'null',
      status: 'APPROVED',
      assignedUserId: 'RECATEGORISER_USER',
      referredDate: null,
      referredBy: 'null',
      sequenceNumber: 1,
      riskProfile: {},
      prisonId: 'LEI',
      offenderNo: 'B0032XY',
      startDate: '2019-07-01 00:00:00.000000 +00:00',
      securityReviewedBy: 'null',
      securityReviewedDate: null,
      approvalDate: '2019-08-05',
      catType: 'RECAT',
      nomisSequenceNumber: null,
      assessmentDate: '2019-07-22',
      approvedBy: 'SUPERVISOR_USER',
      assessedBy: null,
      reviewReason: 'DUE',
      dueByDate: '2019-08-03',
      cancelledDate: null,
      cancelledBy: null,
    },
  ].forEach(rowData => cy.task('insertFormTableDbRow', rowData))
}

export default setupTprsStats
