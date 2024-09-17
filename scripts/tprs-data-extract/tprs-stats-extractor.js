const { defaults } = require('./tprs-stats-helpers')

const { getInitialCategoryBreakdowns } = require('./1207-initial-cat-breakdown')
const { getTprsTotalsNationalInitial, getTprsTotalsNationalRecat } = require('./1207-tprs-national-totals')
const { getTprsReviewsOutput } = require('./1208-tprs-reviews-output')
const { getInitialReferralsToSecurity, getRecatReferralsToSecurity } = require('./1207-referrals-to-security')
const { getInitialAverageDurations, getRecatAverageDurations } = require('./1207-average-durations')
const { getInitialCompletions, getRecatCompletions } = require('./1207-completions')
const { getRecatDecisions } = require('./1207-recat-decisions')
const { getCatCPrisonersWith3OrMoreYearsRemaining } = require('./1211-three-years-or-more')
const { createCsv } = require('./csv-output')
const { createExport } = require('./zip-output')
const { createMetaFile } = require('./meta-output')

;(async () => {
  const args = process.argv.slice(2)
  const startDateArg = args[0]
  const endDateArg = args[1]
  const username = args[2] ?? 'pass your username as the last script argument!'

  const startDate = startDateArg || defaults.startDate
  const endDate = endDateArg || defaults.endDate

  function formatDateForFilename(dateStr) {
    return dateStr.replace(/-/g, '')
  }

  const toExtract = [
    {
      fileName: 'initial_category_breakdowns_all',
      getData: () =>
        getInitialCategoryBreakdowns({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'initial_category_breakdowns_only_tprs',
      getData: () =>
        getInitialCategoryBreakdowns({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'initial_referrals_to_security_all',
      getData: () =>
        getInitialReferralsToSecurity({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'initial_referrals_to_security_only_tprs',
      getData: () =>
        getInitialReferralsToSecurity({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'initial_average_durations_all',
      getData: () =>
        getInitialAverageDurations({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'initial_average_durations_only_tprs',
      getData: () =>
        getInitialAverageDurations({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'initial_completions_all',
      getData: () =>
        getInitialCompletions({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'initial_completions_only_tprs',
      getData: () =>
        getInitialCompletions({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_decisions_all',
      getData: () =>
        getRecatDecisions({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_decisions_only_tprs',
      getData: () =>
        getRecatDecisions({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_referrals_to_security_all',
      getData: () =>
        getRecatReferralsToSecurity({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_referrals_to_security_only_tprs',
      getData: () =>
        getRecatReferralsToSecurity({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_average_durations_all',
      getData: () =>
        getRecatAverageDurations({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_average_durations_only_tprs',
      getData: () =>
        getRecatAverageDurations({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_completions_all',
      getData: () =>
        getRecatCompletions({
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'recat_completions_only_tprs',
      getData: () =>
        getRecatCompletions({
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },

    {
      fileName: 'tprs_initial_national_totals',
      getData: () =>
        getTprsTotalsNationalInitial({
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'tprs_recat_national_totals',
      getData: () =>
        getTprsTotalsNationalRecat({
          startDate,
          endDate,
        }),
    },

    {
      fileName: 'tprs_reviews',
      getData: () =>
        getTprsReviewsOutput({
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'cat_c_with_3_or_more_years_to_serve_all',
      getData: () =>
        getCatCPrisonersWith3OrMoreYearsRemaining({
          username,
          onlyTprs: false,
          startDate,
          endDate,
        }),
    },
    {
      fileName: 'cat_c_with_3_or_more_years_to_serve_only_tprs',
      getData: () =>
        getCatCPrisonersWith3OrMoreYearsRemaining({
          username,
          onlyTprs: true,
          startDate,
          endDate,
        }),
    },
  ]

  console.log('starting...')

  const csvFiles = await Promise.all(
    toExtract.map(async ({ fileName, getData }) => {
      console.log(`processing: ${fileName}`)
      const data = await getData()
      console.log('data', data)
      console.log(`data collected for ${fileName}, creating csv...`)
      const csvFileName = createCsv({ data, fileName })
      console.log(`csv created: ${csvFileName}`)
      return csvFileName
    })
  )

  console.log('all csv files created.')

  const fmtStart = formatDateForFilename(startDate)
  const fmtEnd = formatDateForFilename(endDate)

  console.log('creating meta file...')
  const metaFile = await createMetaFile({
    fileName: 'readme.txt',
    contents: `Data extract stats from: ${fmtStart}, to: ${fmtEnd}`,
  })
  console.log('created meta file')

  const exportFileName = `tprs_export__from_${fmtStart}__to_${fmtEnd}`

  console.log('beginning export...', { exportFileName })

  await createExport([...csvFiles, metaFile])

  console.log('export complete', { exportFileName })
})()
