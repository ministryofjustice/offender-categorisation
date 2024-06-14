const { sortByStatus, sortByDateTime } = require('../../server/services/offenderSort')

describe('sortByStatus', () => {
  it('should return -1 when status1 comes before status2', () => {
    expect(sortByStatus('UNCATEGORISED', 'SECURITY_BACK')).toBe(-1)
    expect(sortByStatus('STARTED', 'SUPERVISOR_BACK')).toBe(-1)
  })

  it('should return 1 when status1 comes after status2', () => {
    expect(sortByStatus('SUPERVISOR_BACK', 'UNCATEGORISED')).toBe(1)
    expect(sortByStatus('SECURITY_BACK', 'STARTED')).toBe(1)
  })

  it('should return 0 when statuses have the same displayOrder', () => {
    expect(sortByStatus('UNCATEGORISED', 'UNCATEGORISED')).toBe(0)
    expect(sortByStatus('UNCATEGORISED', 'STARTED')).toBe(0)
    expect(sortByStatus('APPROVED', 'AWAITING_APPROVAL')).toBe(0)
    expect(sortByStatus('CANCELLED', 'CANCELLED')).toBe(0)
  })

  it('should correctly sort an array of statuses', () => {
    const statuses = ['SUPERVISOR_BACK', 'SECURITY_AUTO', 'SECURITY_BACK', 'UNCATEGORISED', 'APPROVED']

    // flip, as per the real implementation
    statuses.sort((a, b) => sortByStatus(b, a))

    expect(statuses).toEqual(['SUPERVISOR_BACK', 'SECURITY_BACK', 'SECURITY_AUTO', 'UNCATEGORISED', 'APPROVED'])
  })
})

describe('sortByDateTime', () => {
  it('should return positive when t2 is after t1', () => {
    expect(sortByDateTime('01/01/2020', '02/01/2020')).toBeGreaterThan(0)
  })

  it('should return negative when t2 is before t1', () => {
    expect(sortByDateTime('02/01/2020', '01/01/2020')).toBeLessThan(0)
  })

  it('should return zero when t1 is equal to t2', () => {
    expect(sortByDateTime('01/01/2020', '01/01/2020')).toBe(0)
  })

  it('should return -1 when t1 is defined and t2 is undefined', () => {
    expect(sortByDateTime('01/01/2020', undefined)).toBe(-1)
  })

  it('should return 1 when t1 is undefined and t2 is defined', () => {
    expect(sortByDateTime(undefined, '01/01/2020')).toBe(1)
  })

  it('should return 0 when both t1 and t2 are undefined', () => {
    expect(sortByDateTime(undefined, undefined)).toBe(0)
  })

  it('should correctly sort an array of dates', () => {
    const dates = ['02/01/2020', '01/01/2020', '03/01/2020', '01/01/2020', '01/02/2020', undefined]

    // flip, as per the real implementation
    const sortedDates = dates.sort((a, b) => sortByDateTime(b, a))

    expect(sortedDates).toEqual(['01/01/2020', '01/01/2020', '02/01/2020', '03/01/2020', '01/02/2020', undefined])
  })
})

describe('getUncategorisedOffenders :: combined sort by status and date', () => {
  const combinedSort = (a, b) => {
    const status = sortByStatus(b.dbStatus, a.dbStatus)
    return status === 0 ? sortByDateTime(b.dateRequired, a.dateRequired) : status
  }

  it('should correctly sort by status first, then by date', () => {
    const items = [
      { dbStatus: 'UNCATEGORISED', dateRequired: '02/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '01/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '03/03/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '01/01/2020' },
      { dbStatus: 'SECURITY_AUTO', dateRequired: '01/02/2020' },
      { dbStatus: 'SECURITY_BACK', dateRequired: '31/12/2019' },
      { dbStatus: 'SUPERVISOR_BACK', dateRequired: '01/01/2020' },
      { dbStatus: 'SUPERVISOR_BACK', dateRequired: '11/11/2020' },
      { dbStatus: 'SECURITY_BACK', dateRequired: '01/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '02/01/2020' },
      { dbStatus: 'APPROVED', dateRequired: '01/01/2021' },
      { dbStatus: 'STARTED', dateRequired: '03/01/2020' },
      { dbStatus: 'SECURITY_MANUAL', dateRequired: '01/01/2022' },
      { dbStatus: 'SECURITY_FLAGGED', dateRequired: '01/01/2020' },
      { dbStatus: 'AWAITING_APPROVAL', dateRequired: '01/01/2023' },
      { dbStatus: 'CANCELLED', dateRequired: '01/01/2024' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '01/01/2020' },
    ]

    const sortedItems = items.sort(combinedSort)

    expect(sortedItems).toEqual([
      { dbStatus: 'SUPERVISOR_BACK', dateRequired: '01/01/2020' },
      { dbStatus: 'SUPERVISOR_BACK', dateRequired: '11/11/2020' },
      { dbStatus: 'SECURITY_BACK', dateRequired: '31/12/2019' },
      { dbStatus: 'SECURITY_BACK', dateRequired: '01/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '01/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '01/01/2020' },
      { dbStatus: 'SECURITY_FLAGGED', dateRequired: '01/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '01/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '02/01/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '02/01/2020' },
      { dbStatus: 'STARTED', dateRequired: '03/01/2020' },
      { dbStatus: 'SECURITY_AUTO', dateRequired: '01/02/2020' },
      { dbStatus: 'UNCATEGORISED', dateRequired: '03/03/2020' },
      { dbStatus: 'APPROVED', dateRequired: '01/01/2021' },
      { dbStatus: 'SECURITY_MANUAL', dateRequired: '01/01/2022' },
      { dbStatus: 'AWAITING_APPROVAL', dateRequired: '01/01/2023' },
      { dbStatus: 'CANCELLED', dateRequired: '01/01/2024' },
    ])
  })
})
