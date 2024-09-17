const { db, catType } = require('./tprs-stats-helpers')

const query = ({ onlyTprs }) => `
  select avg(extract(day from (date_trunc('day', referred_date) - date_trunc('day', start_date))))              as "fromStartToReferred",
         avg(extract(day from (date_trunc('day', security_reviewed_date) - date_trunc('day', referred_date))))  as "fromReferredToSecurityReviewed",
         avg(extract(day from (approval_date - date_trunc('day', security_reviewed_date))))  as "fromSecurityReviewedToApproval",
         avg(extract(day from (approval_date - date_trunc('day', start_date))))  as "fromStartToApproval"
  from form
  where referred_date is not null
  AND status = 'APPROVED'
  AND cat_type = $3::cat_type_enum
  ${onlyTprs ? `AND form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes'` : ''}
  AND (approval_date >= COALESCE($1::date, (SELECT MIN(approval_date) FROM public.form)))
  AND (approval_date <= COALESCE($2::date, CURRENT_DATE))
  AND prison_id NOT IN ('AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI');
`

module.exports = {
  getInitialAverageDurations: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate, catType.INITIAL])
    return result.rows
  },
  getRecatAverageDurations: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate, catType.RECAT])
    return result.rows
  },
}
