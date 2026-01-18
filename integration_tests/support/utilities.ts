import moment from 'moment'

export const cleanString = (rawText): string => rawText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

const SATURDAY = 6
const SUNDAY = 0
const SUNDAY2 = 7

export const get10BusinessDays = from => {
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

// copied from offendersService
export const calculateDueDate = (sentenceDate: string) => {
  const sentenceDateMoment = moment(sentenceDate, 'YYYY-MM-DD')
  const daysSinceSentence = moment().diff(sentenceDateMoment, 'days')

  const actualDays = get10BusinessDays(sentenceDateMoment)
  const dateRequiredRaw = sentenceDateMoment.add(actualDays, 'day')
  const dateRequired = dateRequiredRaw.format('DD/MM/YYYY')

  return { daysSinceSentence, dateRequired }
}

export const calculateOverdueText = (sentenceDate: string) => {
  const { dateRequired } = calculateDueDate(sentenceDate)
  const today = moment().startOf('day')
  const reviewDate = moment(dateRequired, 'DD/MM/YYYY').startOf('day')

  if (reviewDate.isBefore(today)) {
    const daysOverdue = today.diff(reviewDate, 'days')
    return daysOverdue === 1 ? '1 dayoverdue' : `${daysOverdue} daysoverdue`
  }

  return dateRequired
}

export const isToday = (date: Date): boolean => moment().isSame(date, 'day')

export const compareObjects = (first: object, second: object): boolean => {
  return JSON.stringify(first) === JSON.stringify(second)
}

export default {
  cleanString,
  calculateDueDate,
  isToday,
  compareObjects,
  calculateOverdueText,
}
