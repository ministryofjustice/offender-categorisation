const liteCategoriesPrisonerPartition = require('../../server/utils/liteCategoriesPrisonerPartition')

jest.mock('moment', () => {
  const actual = jest.requireActual('moment')
  return (...args) => (args.length ? actual(...args) : actual('2024-01-01T00:00:00.000Z'))
})

describe('liteCategoriesPrisonerPartition', () => {
  it('handles an empty unapprovedLiteCategorisations array', () => {
    const releaseDateMap = new Map()
    const unapprovedLiteCategorisations = []

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCategorisations, releaseDateMap)
    expect(insidePrison).toEqual([])
    expect(released).toEqual([])
  })

  it('partitions correctly when all release dates are in the future', () => {
    const releaseDateMap = new Map()
    releaseDateMap.set(1, new Date('2024-03-01'))
    releaseDateMap.set(2, new Date('2024-04-01'))

    const unapprovedLiteCats = [{ bookingId: 1 }, { bookingId: 2 }]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, releaseDateMap)
    expect(insidePrison).toEqual([{ bookingId: 1 }, { bookingId: 2 }])
    expect(released).toEqual([])
  })

  it('partitions correctly when all dates dates are in the past', () => {
    const releaseDateMap = new Map()
    releaseDateMap.set(1, new Date('2023-01-01'))
    releaseDateMap.set(2, new Date('2023-01-02'))

    const unapprovedLiteCats = [{ bookingId: 1 }, { bookingId: 2 }]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, releaseDateMap)
    expect(insidePrison).toEqual([])
    expect(released).toEqual([{ bookingId: 1 }, { bookingId: 2 }])
  })

  it('partitions unapprovedLiteCategorisations into two when given a mixture', () => {
    const releaseDateMap = new Map()
    releaseDateMap.set(1, new Date('2024-02-02'))
    // one that is already released
    releaseDateMap.set(2, new Date('2023-01-01'))

    const unapprovedLiteCats = [
      { bookingId: 1 },
      { bookingId: 2 },
      // simulate a dead prisoner - doesn't appear in the map
      { bookingId: 3 },
    ]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, releaseDateMap)
    expect(insidePrison).toEqual([{ bookingId: 1 }])
    expect(released).toEqual([{ bookingId: 2 }, { bookingId: 3 }])
  })

  it('handles a release date map with no matching bookingIds', () => {
    const releaseDateMap = new Map()
    releaseDateMap.set(666, new Date('2024-03-01'))

    const unapprovedLiteCats = [{ bookingId: 1 }, { bookingId: 2 }]

    const [insidePrison, released] = liteCategoriesPrisonerPartition(unapprovedLiteCats, releaseDateMap)
    expect(insidePrison).toEqual([])
    expect(released).toEqual([{ bookingId: 1 }, { bookingId: 2 }])
  })
})
