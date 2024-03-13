const fs = require('fs/promises')
const jose = require('node-jose')

/**
 * Run this first.
 *
 * This will create a local `keys.json` file which can then be used for signing and verifying tokens.
 */
;(async () => {
  const keyStore = jose.JWK.createKeyStore()
  await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })
  await fs.writeFile('keys.json', JSON.stringify(keyStore.toJSON(true), null, 2))
})()
