const moment = require('moment')
const { db } = require('./tprs-stats-helpers')
const prisonerSearchClientBuilder = require('../../server/data/prisonerSearchApi')

const query = ({ onlyTprs }) => `
  with prisoners_table as (select f.offender_no,
                               f.booking_id,
                            f.sequence_no,
                            f.prison_id,
                            f.cat_type,
                            coalesce(f.form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory',
                                     f.form_response -> 'recat' -> 'decision' ->> 'category') as cat
                     from form as f
                     where status = 'APPROVED'
                         ${onlyTprs ? `AND form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes'` : ''}
                       AND (approval_date >= COALESCE($1::date, (SELECT MIN(approval_date) FROM public.form)))
                       AND (approval_date <= COALESCE($2::date, CURRENT_DATE))
                       AND prison_id NOT IN
                           ('AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI')
                     )
      select *
from prisoners_table
where cat = 'C'
`

/**
 * @typedef {object} Booking
 * @property {string} offender_no
 * @property {number} booking_id
 * @property {number} sequence_no
 * @property {string} prison_id
 * @property {string} cat_type
 * @property {string} cat
 */

/**
 * @param {boolean} onlyTprs
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Booking[][]>}
 */
const getCatCPrisoners = async ({ onlyTprs, startDate, endDate }) => {
  /**
   * @type {QueryArrayResult<Booking[]>}
   */
  const result = await db.query(query({ onlyTprs }), [startDate, endDate])
  return result.rows
}
const createBookingsMap = ({ bookings }) => {
  const bookingMap = new Map()

  bookings.forEach(booking => {
    bookingMap.set(booking.booking_id.toString(), booking)
  })

  return bookingMap
}
/**
 * @param {Booking[]} bookings
 * @returns {Promise<Booking[][]>}
 */
const getPrisonerSearchData = async ({ username, bookingIds }) => {
  const prisonerSearchClient = prisonerSearchClientBuilder({ user: { username } })
  return prisonerSearchClient.getPrisonersByBookingIds([...bookingIds])
}

const updateBookingMapWithSearchResult = ({ bookingMap, prisonerSearchData }) => {
  prisonerSearchData.forEach(result => {
    // console.log('111', result)
    // ensure consistent key format
    const bookingIdStr = result.bookingId.toString()
    const existingBooking = bookingMap.get(bookingIdStr)
    // console.log('222', existingBooking)
    const updatedBooking = {
      ...existingBooking,
      ...result,
      releaseDateObject: new Date(result.releaseDate),
    }
    // console.log('updatedBooking', updatedBooking)
    bookingMap.set(bookingIdStr, updatedBooking)
  })

  return bookingMap
}

module.exports = {
  getCatCPrisonersWith3OrMoreYearsRemaining: async ({ username, onlyTprs, startDate, endDate }) => {
    const bookings = await getCatCPrisoners({ onlyTprs, startDate, endDate })

    const bookingMap = createBookingsMap({ bookings })
    const bookingIds = bookingMap.keys()

    const prisonerSearchData = await getPrisonerSearchData({ username, bookingIds })
    const updatedBookingMap = updateBookingMapWithSearchResult({ bookingMap, prisonerSearchData })
    const threeYearsFromNow = moment().add(3, 'years')

    return [...updatedBookingMap.values()]
      .filter(booking => moment(booking.releaseDateObject).isSameOrAfter(threeYearsFromNow))
      .map(booking => ({
        offender_no: booking.offender_no,
        booking_id: booking.booking_id,
        sequence_no: booking.sequence_no,
        prison_id: booking.prison_id,
        cat_type: booking.cat_type,
        cat: booking.cat,
        release_date: booking.releaseDate,
      }))
      .sort((a, b) => {
        const comparison = a.prison_id.localeCompare(b.prison_id)
        if (comparison !== 0) {
          return comparison
        }
        return moment(a.release_date).diff(moment(b.release_date))
      })
  },
}
