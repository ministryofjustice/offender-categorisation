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

export default {
  cleanString,
  calculateDueDate,
}
