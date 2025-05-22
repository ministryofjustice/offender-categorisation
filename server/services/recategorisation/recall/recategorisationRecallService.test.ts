import { getRecalledOffendersData } from './recategorisationRecallService'
import makeTestRecategorisationPrisonerSearchDto from '../prisonerSearch/recategorisationPrisonerSearch.dto.test-factory'

describe('getRecalledOffendersData', () => {
  test('it should get the correct recall offender data', async () => {
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

    const testPrisonerSearchData = new Map([
      [
        'ABC123',
        makeTestRecategorisationPrisonerSearchDto({
          bookingId: 123,
          recall: true,
        }),
      ],
      [
        'DEF456',
        makeTestRecategorisationPrisonerSearchDto({
          bookingId: 456,
          recall: false,
        }),
      ],
    ])

    const result = await getRecalledOffendersData(testPrisonerSearchData, nomisClient)

    expect(result).toEqual(new Map([['ABC123', { recallDate: '2024-04-05' }]]))
    expect(nomisClient.getOffenderPrisonPeriods).toHaveBeenCalledTimes(1)
    expect(nomisClient.getOffenderPrisonPeriods).toHaveBeenCalledWith('ABC123')
  })
})
