import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
   allowlist: {
     // Needed by esbuild for watching files during development
     'node_modules/@parcel/watcher@2.5.1': 'ALLOW',
    // Needed for running integration tests:
    'node_modules/cypress@15.5.0': 'ALLOW',
   },
})
