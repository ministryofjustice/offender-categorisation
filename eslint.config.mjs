import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: [
    'test_results',
    'integration-tests/build',
    '*.html',
    'assets/js/preventDoubleSubmit/index.js',
    'assets/js/html5shiv-3.7.3.min.js',
    'audit-ci.json',
    './integration_tests/**',
    '**/*.js',
  ],
  extraPathsAllowingDevDependencies: ['cypress.config.ts'],
  extraGlobals: { $: false },
})
