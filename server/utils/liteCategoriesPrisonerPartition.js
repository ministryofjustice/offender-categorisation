function liteCategoriesPrisonerPartition(unapprovedLiteCategorisations, prisonerData) {
  const insidePrison = []
  const released = []

  unapprovedLiteCategorisations.forEach(offender => {
    const prisoner = prisonerData.find(pd => pd.bookingId === offender.bookingId)

    const prisonerCurrentlyInPrison = prisoner && prisoner.status.startsWith('ACTIVE')
    if (prisonerCurrentlyInPrison) {
      insidePrison.push(offender)
    } else {
      released.push(offender)
    }
  })

  return [insidePrison, released]
}

module.exports = liteCategoriesPrisonerPartition
