const liteCategoriesPrisonerPartition = require('../../server/utils/liteCategoriesPrisonerPartition')

describe('liteCategoriesPrisonerPartition', () => {
  it('handles an empty unapprovedLiteCategorisations array', () => {
    const unapprovedLiteCats = []
    const prisonerData = []

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, prisonerData)
    expect(insidePrison).toEqual([])
    expect(released).toEqual([])
  })

  it('partitions correctly when all prisoners are ACTIVE IN', () => {
    const unapprovedLiteCats = [{ bookingId: 1 }, { bookingId: 2 }]
    const prisonerData = [
      {
        bookingId: 1,
        status: 'ACTIVE IN',
      },
      {
        bookingId: 2,
        status: 'ACTIVE IN',
      },
    ]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, prisonerData)
    expect(insidePrison).toEqual([{ bookingId: 1 }, { bookingId: 2 }])
    expect(released).toEqual([])
  })

  it('partitions correctly when all prisoners are not ACTIVE IN', () => {
    const unapprovedLiteCats = [{ bookingId: 1 }, { bookingId: 2 }]
    const prisonerData = [
      {
        bookingId: 1,
        status: 'INACTIVE OUT',
      },
      {
        bookingId: 2,
        status: 'ANYTHING ELSE',
      },
    ]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, prisonerData)
    expect(insidePrison).toEqual([])
    expect(released).toEqual([{ bookingId: 1 }, { bookingId: 2 }])
  })

  it('partitions unapprovedLiteCategorisations into two when given a mixture', () => {
    const prisonerData = [
      {
        bookingId: 1,
        status: 'INACTIVE OUT',
      },
      {
        bookingId: 2,
        status: 'ACTIVE IN',
      },
    ]

    const unapprovedLiteCats = [
      { bookingId: 1 },
      { bookingId: 2 },
      // simulate a dead prisoner
      { bookingId: 3 },
    ]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, prisonerData)
    expect(insidePrison).toEqual([{ bookingId: 2 }])
    expect(released).toEqual([{ bookingId: 1 }, { bookingId: 3 }])
  })

  it('handles a prisonerData with no matching bookingIds', () => {
    const prisonerData = []

    const unapprovedLiteCats = [{ bookingId: 1 }, { bookingId: 2 }]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, prisonerData)
    expect(insidePrison).toEqual([])
    expect(released).toEqual([{ bookingId: 1 }, { bookingId: 2 }])
  })
})
