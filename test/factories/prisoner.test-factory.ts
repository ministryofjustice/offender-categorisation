const makeTestPrisoner = (bookingId: number = 12345, offenderNumber: string = 'G12345') => ({
  bookingId,
  offenderNo: offenderNumber,
  firstName: 'PETER',
  lastName: 'PAN',
  category: 'C',
  nextReviewDate: '2019-04-20',
  assessStatus: 'P',
})

export default makeTestPrisoner
