const moment = require('moment')

const sortByDateTime = (t1, t2) => {
  if (t1 && t2) {
    return moment(t1).valueOf() - moment(t2).valueOf()
  }
  if (t1) return -1
  if (t2) return 1
  return 0
}

const sortByLastNameFirstName = (a, b) => {
  const o1 = a.lastName.toLowerCase()
  const o2 = b.lastName.toLowerCase()

  const p1 = a.firstName.toLowerCase()
  const p2 = b.firstName.toLowerCase()

  if (o1 < o2) return -1
  if (o1 > o2) return 1
  if (p1 < p2) return -1
  if (p1 > p2) return 1
  return 0
}

module.exports = {
  sortByDateTime,
  sortByLastNameFirstName,
}
