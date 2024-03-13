const express = require('express')
const jose = require('node-jose')
const fs = require('fs/promises')

const app = express()
const port = 3331

/**
 * Be sure to run `node jwks-gen.js` at least one time before running this
 *
 * Start with `node jwks.js`
 */
app.get('/.well-known/jwks.json', async (req, res) => {
  const keys = await fs.readFile('keys.json', 'utf-8')
  const keyStore = await jose.JWK.asKeyStore(keys.toString())
  const [key] = keyStore.all({ use: 'sig' })

  const options = {
    compact: true,
    jwk: key,
    fields: {
      typ: 'jwt',
    },
  }

  const token = await jose.JWS.createSign(options, key)
    .update(
      JSON.stringify({
        user_name: 'TIMMY',
        scope: ['read'],
        auth_source: 'nomis',
        authorities: ['SOME', 'ROLES', 'ROLE_SAR_DATA_ACCESS'],
        jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
        client_id: 'clientid',
        issuer: `http://0.0.0.0:3331/.well-known/jwks.json`,
        iss: `http://0.0.0.0:3331/.well-known/jwks.json`,
        sub: 'chris',
      })
    )
    .final()
  console.debug('use this for API requests', { token })

  res.json(keyStore.toJSON())
})

app.listen(port, () => {
  console.log('serving local jwks for testing')
})
