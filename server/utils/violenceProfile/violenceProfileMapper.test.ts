import { mapDataToViolenceProfile } from './violenceProfileMapper'
import { makeTestViperDto } from '../../data/formApi/viper/viper.dto.test-factory'
import { makeTestCountOfAssaultIncidents } from '../../services/incidents/countOfAssaultIncidents.test-factory'
import { makeTestViolenceProfile } from './violenceProfile.test-factory'

describe('mapDataToViolenceProfile', () => {
  it('maps valid objects to violence profile', () => {
    expect(
      mapDataToViolenceProfile(
        makeTestViperDto({ aboveThreshold: true }),
        makeTestCountOfAssaultIncidents({
          countOfAssaults: 5,
          countOfSeriousAssaults: 2,
          countOfNonSeriousAssaults: 3,
        }),
      ),
    ).toEqual(
      makeTestViolenceProfile({
        notifySafetyCustodyLead: true,
        numberOfAssaults: 5,
        numberOfSeriousAssaults: 2,
        numberOfNonSeriousAssaults: 3,
      }),
    )
  })

  it('maps valid objects to violence profile with false notifyRegionalCTLead', () => {
    expect(
      mapDataToViolenceProfile(
        makeTestViperDto({ aboveThreshold: false }),
        makeTestCountOfAssaultIncidents({
          countOfAssaults: 5,
          countOfSeriousAssaults: 2,
          countOfNonSeriousAssaults: 3,
        }),
      ),
    ).toEqual(
      makeTestViolenceProfile({
        notifySafetyCustodyLead: false,
        numberOfAssaults: 5,
        numberOfSeriousAssaults: 2,
        numberOfNonSeriousAssaults: 3,
      }),
    )
  })

  it('maps undefined viper object but valid countOfAssaultsAndIncidents object to violence profile', () => {
    expect(
      mapDataToViolenceProfile(
        undefined,
        makeTestCountOfAssaultIncidents({
          countOfAssaults: 5,
          countOfSeriousAssaults: 2,
          countOfNonSeriousAssaults: 3,
        }),
      ),
    ).toEqual(
      makeTestViolenceProfile({
        notifySafetyCustodyLead: false,
        numberOfAssaults: 5,
        numberOfSeriousAssaults: 2,
        numberOfNonSeriousAssaults: 3,
      }),
    )
  })

  it('maps valid viper object but undefined countOfAssaultsAndIncidents object to violence profile', () => {
    expect(mapDataToViolenceProfile(makeTestViperDto({ aboveThreshold: true }), undefined)).toEqual(
      makeTestViolenceProfile({
        notifySafetyCustodyLead: true,
        numberOfAssaults: 0,
        numberOfSeriousAssaults: 0,
        numberOfNonSeriousAssaults: 0,
      }),
    )
  })
})
