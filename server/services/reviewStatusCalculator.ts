import { format, isValid, parse, startOfDay } from 'date-fns'
import { safeIsBefore } from '../utils/utils'

export const isReviewOverdue = (nextReviewDate: string | Date | null | undefined): boolean => {
  if (!nextReviewDate) return false

  const date = typeof nextReviewDate === 'string' ? parse(nextReviewDate, 'yyyy-MM-dd', new Date()) : nextReviewDate

  if (!isValid(date)) return false

  // Ensure strict match if input was a string
  if (typeof nextReviewDate === 'string' && format(date, 'yyyy-MM-dd') !== nextReviewDate) {
    return false
  }

  return safeIsBefore(date, startOfDay(new Date()))
}
