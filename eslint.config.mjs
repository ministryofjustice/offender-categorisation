// @ts-check

import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'
// import globals from 'globals'

export default [
  ...hmppsConfig({
    extraIgnorePaths: [
      'integration_tests/**',
      '**/*.min.js',
      'integration-tests/build',
      'node_modules',
      'eslint.config.mjs',
      '*.js',
    ],
    extraPathsAllowingDevDependencies: ['test/**'],

    // // Pass in merged globals from browser, node, and jest environments
    // extraUnitTestGlobals: {
    //   ...globals.browser,
    //   ...globals.node,
    //   expect: 'readonly',
    //   sinon: 'readonly',
    // },
  }),
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  // TEMP: Project-wide overrides to silence rules during ESLint 9 upgrade
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    rules: {
      // TEMP: Turn off rule until upgrade is complete and violations are fixed
      // '@typescript-eslint/no-empty-object-type': 'off',
      // 'comma-dangle': 'off',
      // 'prettier/prettier': 'off',
      // 'no-plusplus': 'off',
      // 'no-shadow': 'off',
      // 'func-names': 'off',
      // 'no-undef': 'off',
      // 'no-param-reassign': 'off',
      // 'no-continue': 'off',      'import/no-unresolved': 'off',
      // PIPELINE ERRORS
      'import/extensions': 'off',
      'import/no-cycle': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/order': 'off',
      'import/no-self-import': 'off',
      'import/no-useless-path-segments': 'off',
      'import/no-duplicates': 'off',
      'import/namespace': 'off',
      'import/no-relative-packages': 'off',
      'import/default': 'off',
      'import/no-named-as-default': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // {
  //   files: ['test/**/*.{js,ts}'],
  //   languageOptions: {
  //     globals: {
  //       ...globals.node,
  //       ...globals.jest,
  //       expect: 'readonly',
  //       sinon: 'readonly',
  //     },
  //   },
  // },
  // // Test-specific environment and globals
  // {
  //   files: ['test/**/*.{js,ts}'],
  //   languageOptions: {
  //     env: {
  //       browser: true,
  //       node: true,
  //       jest: true,
  //     },
  //     globals: {
  //       expect: 'readonly',
  //       sinon: 'readonly',
  //     },
  //   },
  // },
]
