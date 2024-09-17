const { db, catType } = require('./tprs-stats-helpers')

const query = ({ onlyTprs }) => `
  select count(*),
         extract(day from (coalesce(due_by_date, approval_date) - date_trunc('day', approval_date))) >= 0 as "onTime"
  from form
  where referred_date is not null
  AND status = 'APPROVED'
  AND cat_type = $3::cat_type_enum
  ${onlyTprs ? `AND form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes'` : ''}
  AND (approval_date >= COALESCE($1::date, (SELECT MIN(approval_date) FROM public.form)))
  AND (approval_date <= COALESCE($2::date, CURRENT_DATE))
  AND prison_id NOT IN ('AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI')
  group by "onTime";
`

module.exports = {
  getInitialCompletions: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate, catType.INITIAL])
    return result.rows
  },
  getRecatCompletions: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate, catType.RECAT])
    return result.rows
  },
}
