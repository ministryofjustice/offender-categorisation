const nock = require('nock')

const config = require('../../server/config')
const custodyClientBuilder = require('../../server/data/custodyClientBuilder')

describe('custodyClient', () => {
  let fakeCustodyApi
  let fakeNomisAuth
  let custodyClient

  const offendersInPrisonResponse = {
    _embedded: {
      offenders: [
        {
          nomsId: 'G4273GI',
          offenderId: 1284739,
          firstName: 'OZULLIRN',
          middleNames: 'TESSE',
          surname: 'ABBELLA',
          dateOfBirth: '1980-08-15',
          activeBooking: {
            bookingId: 1153753,
            bookingNo: '04581A',
            offenderId: 1284739,
            rootOffenderId: 1284739,
            agencyLocation: {
              agencyLocationId: 'LEI',
              description: 'LEEDS (HMP)',
              longDescription: 'HMP LEEDS',
              agencyLocationType: 'INST',
            },
            activeFlag: true,
            bookingStatus: 'O',
            inOutStatus: 'IN',
            statusReason: 'CRT-PR',
            startDate: '2016-11-26',
            bookingSequence: 1,
          },
        },
        {
          nomsId: 'G7806VO',
          offenderId: 2003241,
          firstName: 'ONGMETAIN',
          surname: 'ABDORIA',
          dateOfBirth: '1990-12-06',
          activeBooking: {
            bookingId: 754207,
            bookingNo: 'K09211',
            offenderId: 2003241,
            rootOffenderId: 2003241,
            agencyLocation: {
              agencyLocationId: 'LEI',
              description: 'LEEDS (HMP)',
              longDescription: 'HMP LEEDS',
              agencyLocationType: 'INST',
            },
            activeFlag: true,
            bookingStatus: 'O',
            inOutStatus: 'IN',
            statusReason: 'ADM-L',
            startDate: '2013-06-03',
            bookingSequence: 1,
          },
        },
      ],
    },
  }

  beforeEach(() => {
    fakeNomisAuth = nock(`${config.apis.oauth2.url}`)
    fakeCustodyApi = nock(`${config.apis.custody.url}`)
    custodyClient = custodyClientBuilder('username')
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getOffendersInPrison', () => {
    it('should return data from api', async () => {
      fakeNomisAuth.post(`/oauth/token`).reply(200, { access_token: 'token123' })
      fakeCustodyApi.get(`/api/offenders/prison/LEI`).reply(200, offendersInPrisonResponse)

      const output = await custodyClient.getOffendersInPrison('LEI')
      return expect(output).toEqual(offendersInPrisonResponse)
    })
  })
})
