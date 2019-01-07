const nock = require('nock');

const config = require('../../server/config');
const custodyClientBuilder = require('../../server/data/custodyClientBuilder');

describe('custodyClient', function() {
    let fakeCustodyApi;
    let fakeNomisAuth;
    let custodyClient;

    beforeEach(() => {
        fakeNomisAuth = nock(`${config.apis.oauth2.url}`).log(console.log);
        fakeCustodyApi = nock(`${config.apis.custody.url}`).log(console.log);
        custodyClient = custodyClientBuilder('username');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('getOffendersInPrison', () => {

        it('should return data from api', async () => {
          fakeNomisAuth
            .post(`/oauth/token`)
            .reply(200, {access_token: 'token123'});
          fakeCustodyApi
            .get(`/api/offenders/prison/LEI`)
            .reply(200, {key: 'value'});

          const output = await custodyClient.getOffendersInPrison('LEI')
            return expect(stuff).toEqual({key: 'value'});
        });
    });

});

