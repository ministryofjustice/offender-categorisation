const makeTestPrisoner = (offenderNo: string = 'G12345') => ({
  offenderNo,
  firstName: 'PETER',
  lastName: 'PAN',
  bookingId: 123,
  category: 'C',
  nextReviewDate: '2019-04-20',
  assessStatus: 'P',
})

export default makeTestPrisoner
