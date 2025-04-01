const makeTestPrisoner = (
  bookingId: number = 12345,
  offenderNumber: string = 'G12345',
  nextReviewDate: string = '2019-04-20',
) => ({
  bookingId,
  offenderNo: offenderNumber,
  firstName: 'PETER',
  lastName: 'PAN',
  category: 'C',
  nextReviewDate,
  assessStatus: 'P',
})

export default makeTestPrisoner
