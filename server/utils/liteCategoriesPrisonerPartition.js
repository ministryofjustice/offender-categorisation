function liteCategoriesPrisonerPartition(unapprovedLiteCategorisations, prisonerData) {
  const insidePrison = []
  const released = []

  unapprovedLiteCategorisations.forEach(offender => {
    const prisoner = prisonerData.find(pd => pd.bookingId === offender.bookingId)

    if (prisoner && prisoner.status === 'ACTIVE IN') {
      insidePrison.push(offender)
    } else {
      released.push(offender)
    }
  })

  return [insidePrison, released]
}

module.exports = liteCategoriesPrisonerPartition
