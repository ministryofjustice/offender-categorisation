import moment from 'moment/moment'

const SATURDAY = 6
const SUNDAY = 0
const SUNDAY2 = 7

export const get10BusinessDays = (from: moment.Moment) => {
  let numberOfDays = 14
  switch (from.isoWeekday()) {
    case SATURDAY:
      numberOfDays += 2
      break
    case SUNDAY:
    case SUNDAY2:
      numberOfDays += 1
      break
    default:
  }
  return numberOfDays
}

export const add10BusinessDays = (isoDate: string) => {
  const sentenceDateMoment = moment(isoDate, 'YYYY-MM-DD')
  const numberOfDays = get10BusinessDays(sentenceDateMoment)
  return sentenceDateMoment.add(numberOfDays, 'day').format('YYYY-MM-DD')
}
