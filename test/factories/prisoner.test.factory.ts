const makeTestPrisoner = (bookingId: number = 12345) => ({
  bookingId,
  offenderNo: 'G12345',
  firstName: 'PETER',
  lastName: 'PAN',
  category: 'C',
  nextReviewDate: '2019-04-20',
  assessStatus: 'P',
})

export default makeTestPrisoner
