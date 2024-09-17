const { db } = require('./tprs-stats-helpers')

const query = ({ onlyTprs }) => `
  with cat_table as (
    select f.booking_id,
           f.sequence_no,
           f.prison_id,
           (select
              coalesce(f1.form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory',
                       f1.form_response -> 'recat' -> 'decision' ->> 'category',
                       f1.form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory',
                       f1.form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory'
                ) as previous_cat
            from form as f1
            where f1.booking_id = f.booking_id
              and f1.sequence_no < f.sequence_no
              and f1.status = 'APPROVED'
              and ($2::date is null or f1.approval_date <= $2::date)
            order by sequence_no desc
            LIMIT 1) as previous_cat,
           coalesce(f.form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory',
                    f.form_response -> 'recat' -> 'decision' ->> 'category') as cat
    from form as f
    where
      status = 'APPROVED'
      AND cat_type = 'RECAT'::cat_type_enum
      ${onlyTprs ? `AND form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes'` : ''}
      AND (approval_date >= COALESCE($1::date, (SELECT MIN(approval_date) FROM public.form)))
      AND (approval_date <= COALESCE($2::date, CURRENT_DATE))
      AND prison_id NOT IN ('AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI')
  ),
       arrays_table as (
         select array_agg(array [prison_id,previous_cat,cat] order by sequence_no desc) as data
         from cat_table
         group by prison_id, booking_id,sequence_no
       )
  select count(*), data[1][1] as prison_id, data[1][2] as previous, data[1][3] as current
  from arrays_table
  group by prison_id, previous, current;
`

module.exports = {
  getRecatDecisions: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate])
    return result.rows
  },
}
