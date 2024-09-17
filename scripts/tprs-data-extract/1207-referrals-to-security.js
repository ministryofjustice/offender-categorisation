const { db, catType } = require('./tprs-stats-helpers')

const query = ({ onlyTprs }) => `
  select count(*),
         CASE
           WHEN
               risk_profile -> 'socProfile' ->> 'transferToSecurity' is not null and
               risk_profile -> 'socProfile' ->> 'transferToSecurity' = 'true' THEN 'auto'
           WHEN
               form_response -> 'ratings' -> 'securityInput' ->> 'securityInputNeeded' is not null or
               form_response -> 'recat' -> 'securityInput' ->> 'securityInputNeeded' is not null THEN 'manual'
           ELSE 'flagged'
           END as "security"
  from form
  where referred_date is not null
  AND status = 'APPROVED'
  AND cat_type = $3::cat_type_enum
  ${onlyTprs ? `AND form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes'` : ''}
  AND (approval_date >= COALESCE($1::date, (SELECT MIN(approval_date) FROM public.form)))
  AND (approval_date <= COALESCE($2::date, CURRENT_DATE))
  AND prison_id NOT IN ('AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI')
  group by "security";
`

module.exports = {
  getInitialReferralsToSecurity: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate, catType.INITIAL])
    return result.rows
  },
  getRecatReferralsToSecurity: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate, catType.RECAT])
    return result.rows
  },
}
