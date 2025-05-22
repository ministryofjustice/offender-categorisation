import moment from 'moment'
import {
  setDatesForRecalledPrisoners,
  isFixedTermRecallLessThanAndEqualTo28Days,
  filterOutRecalledPrisoners,
} from './recallFilter'
import { RecategorisationPrisonerSearchDto } from '../recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto'
import makeTestRecategorisationPrisonerSearchDto from '../recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto.test-factory'

describe('Recall filter', () => {
  describe('setDatesForRecalledPrisoners', () => {
    it('sets dueDateForRecalls and lastDateInPrison based on latest date', async () => {
      const nomisClient = {
        getOffenderPrisonPeriods: jest.fn().mockResolvedValue({
          prisonPeriod: [
            {
              bookingId: 123,
              movementDates: [
                { dateInToPrison: '2024-01-10' },
                { dateInToPrison: '2024-04-05' },
                { dateInToPrison: '2024-03-01' },
              ],
            },
          ],
        }),
      }

      const recatPrisonerSearchDto: RecategorisationPrisonerSearchDto = makeTestRecategorisationPrisonerSearchDto()

      await setDatesForRecalledPrisoners(nomisClient, 'A1234BC', 123, recatPrisonerSearchDto)

      expect(recatPrisonerSearchDto.lastDateInPrison).toEqual('2024-04-05')
      expect(recatPrisonerSearchDto.dueDateForRecalls).toBe(
        moment('2024-04-05', 'YYYY-MM-DD').add(10, 'days').format('YYYY-MM-DD'),
      )
    })

    it('does nothing if booking ID not found', async () => {
      const nomisClient = {
        getOffenderPrisonPeriods: jest.fn().mockResolvedValue({
          prisonPeriod: [],
        }),
      }

      const recatPrisonerSearchDto: RecategorisationPrisonerSearchDto = makeTestRecategorisationPrisonerSearchDto()
      await setDatesForRecalledPrisoners(nomisClient, 'A1234BC', 999, recatPrisonerSearchDto)

      expect(recatPrisonerSearchDto).toEqual({
        lastDateInPrison: '2025-01-01',
        legalStatus: 'SENTENCED',
        postRecallReleaseDate: '2025-01-01',
        recall: false,
        sentenceStartDate: '2025-01-01',
      })
    })
  })

  describe('isFixedTermRecallLessThanAndEqualTo28Days', () => {
    it('returns true when difference between post recall date and last date in prison is less than 28 days', () => {
      const dto = {
        lastDateInPrison: '2025-05-01',
        postRecallReleaseDate: '2025-05-15',
      } as RecategorisationPrisonerSearchDto

      expect(isFixedTermRecallLessThanAndEqualTo28Days(dto)).toBe(true)
    })

    it('returns true when difference between post recall date and last date in prison  is equal to 28 days', () => {
      const dto = {
        lastDateInPrison: '2025-05-01',
        postRecallReleaseDate: '2025-05-29',
      } as RecategorisationPrisonerSearchDto

      expect(isFixedTermRecallLessThanAndEqualTo28Days(dto)).toBe(true)
    })

    it('returns false when difference between post recall date and last date in prison is > 28 days', () => {
      const dto = {
        lastDateInPrison: '2025-05-01',
        postRecallReleaseDate: '2025-06-10',
      } as RecategorisationPrisonerSearchDto

      expect(isFixedTermRecallLessThanAndEqualTo28Days(dto)).toBe(false)
    })

    it('returns false if postRecallReleaseDate is not set', () => {
      const dto = {
        lastDateInPrison: '2025-05-01',
      } as RecategorisationPrisonerSearchDto

      expect(isFixedTermRecallLessThanAndEqualTo28Days(dto)).toBe(false)
    })
  })

  describe('filterOutRecalledPrisoners', () => {
    it('filters out fixed-term recalls of 28 days or less', async () => {
      const prisoners = [
        { bookingId: 1, prisonerNumber: 'A1111AA' },
        { bookingId: 2, prisonerNumber: 'A2222BB' },
      ]

      const prisonerSearchData = new Map([
        [
          1,
          Object.assign({} as RecategorisationPrisonerSearchDto, {
            recall: true,
            postRecallReleaseDate: '2024-05-15',
            lastDateInPrison: '2024-04-20',
          }),
        ],
        [
          2,
          Object.assign({} as RecategorisationPrisonerSearchDto, {
            recall: true,
            postRecallReleaseDate: '2024-05-15',
          }),
        ],
      ])

      const nomisClient = {
        getOffenderPrisonPeriods: async offenderNo => {
          if (offenderNo === 'A1111AA') {
            return {
              prisonPeriod: [
                {
                  bookingId: 1,
                  movementDates: [{ dateInToPrison: '2024-04-20T15:54:56' }],
                },
              ],
            }
          }

          if (offenderNo === 'A2222BB') {
            return {
              prisonPeriod: [
                {
                  bookingId: 2,
                  movementDates: [{ dateInToPrison: '2024-01-20T15:54:56' }],
                },
              ],
            }
          }
          return {}
        },
      }

      const result = await filterOutRecalledPrisoners(prisoners, prisonerSearchData, nomisClient)

      expect(result).toEqual([
        { bookingId: 2, prisonerNumber: 'A2222BB' }, // only this one stays
      ])
    })

    it('does not filter out prisoners with no recall or over 28 day recall', async () => {
      const prisoners = [
        { bookingId: 3, prisonerNumber: 'A3333CC' },
        { bookingId: 4, prisonerNumber: 'A4444DD' },
      ]

      const prisonerSearchData = new Map([
        [
          3,
          {
            recall: true,
            postRecallReleaseDate: '2024-06-01',
            lastDateInPrison: '2024-04-01', // 61 days → should stay
          } as RecategorisationPrisonerSearchDto,
        ],
        [
          4,
          {
            recall: false,
          } as RecategorisationPrisonerSearchDto,
        ],
      ])

      const nomisClient = {
        getOffenderPrisonPeriods: async offenderNo => {
          if (offenderNo === 'A3333CC') {
            return {
              prisonPeriod: [
                {
                  bookingId: 3,
                  movementDates: [{ dateInToPrison: '2024-04-12T15:54:56' }],
                },
              ],
            }
          }

          if (offenderNo === 'A4444DD') {
            return {
              prisonPeriod: [
                {
                  bookingId: 4,
                  movementDates: [{ dateInToPrison: '2024-01-12T15:54:56' }],
                },
              ],
            }
          }
          return {}
        },
      }

      const result = await filterOutRecalledPrisoners(prisoners, prisonerSearchData, nomisClient)

      expect(result).toEqual([
        { bookingId: 3, prisonerNumber: 'A3333CC' },
        { bookingId: 4, prisonerNumber: 'A4444DD' },
      ])
    })
  })
})
