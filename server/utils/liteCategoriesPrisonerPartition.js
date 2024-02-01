const moment = require('moment')

function liteCategoriesPrisonerPartition(unapprovedLiteCategorisations, releaseDateMap) {
  const insidePrison = []
  const released = []

  unapprovedLiteCategorisations.forEach(item => {
    const bookingDate = releaseDateMap.get(item.bookingId)

    if (bookingDate && moment().isBefore(moment(bookingDate))) {
      insidePrison.push(item)
    } else {
      released.push(item)
    }
  })

  return [insidePrison, released]
}

module.exports = liteCategoriesPrisonerPartition
