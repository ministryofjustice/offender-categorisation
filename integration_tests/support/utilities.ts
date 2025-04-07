import moment from 'moment'
import { addDays, getISODay } from 'date-fns'

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

// [TODO]: This function uses a fixed approximation of 10 business days by adding 14 calendar days,
//    and adding extra days if the start date is on a weekend.
//    -
//    For example, given a start date of Saturday 12 Jan 2019:
//      - Saturday is skipped, so the first business day is Monday 14 Jan
//      - 10 business days: 14, 15, 16, 17, 18 and 21, 22, 23, 24, 25 → ends on Friday 25 Jan
//      - However, this function adds 14 + 2 days (for starting on Saturday), resulting in 28 Jan (Mon)
//    -
//    This behaviour matches legacy expectations but is not a true business day calculation.
//    Re-evaluation recommended: proper handling should account for weekends and possibly public holidays
export const get10BusinessDaysLegacy = (startDate: Date): Date => {
  let daysToAdd = 14
  const weekday = getISODay(startDate) // 1 = Monday, 7 = Sunday

  if (weekday === 6) daysToAdd += 2 // Saturday
  if (weekday === 7) daysToAdd += 1 // Sunday

  return addDays(startDate, daysToAdd)
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

export const calculateOverdueText: any = (sentenceDate: string) => {
  const { daysSinceSentence, dateRequired } = calculateDueDate(sentenceDate)
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
