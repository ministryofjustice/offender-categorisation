import moment from 'moment/moment'

export const isReviewOverdue = (nextReviewDate: string) => {
  const date = moment(nextReviewDate, 'YYYY-MM-DD')
  return date.isBefore(moment(0, 'HH'))
}
