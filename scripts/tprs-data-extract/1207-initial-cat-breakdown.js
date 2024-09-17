const { db } = require('./tprs-stats-helpers')

const query = ({ onlyTprs }) => `
  SELECT prison_id,
  COUNT(*) AS count,
    form_response -> 'categoriser' -> 'provisionalCategory' ->> 'suggestedCategory' AS "initialCat",
    form_response -> 'categoriser' -> 'provisionalCategory' ->> 'overriddenCategory' AS "initialOverride",
    form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory'     AS "superOverride"
  FROM form
  WHERE cat_type = 'INITIAL'::cat_type_enum
  AND status = 'APPROVED'
  ${onlyTprs ? `AND form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes'` : ''}
  AND (approval_date >= COALESCE($1::date, (SELECT MIN(approval_date) FROM public.form)))
  AND (approval_date <= COALESCE($2::date, CURRENT_DATE))
  AND prison_id NOT IN ('AGI', 'DWI', 'DHI', 'ESI', 'EWI', 'BZI', 'FHI', 'LNI', 'SDI', 'STI', 'NHI', 'PFI')
  GROUP BY prison_id, "initialCat", "initialOverride", "superOverride"
  ORDER BY prison_id, "initialCat", "initialOverride" NULLS FIRST, "superOverride" NULLS FIRST;
`

module.exports = {
  getInitialCategoryBreakdowns: async ({ onlyTprs, startDate, endDate }) => {
    const result = await db.query(query({ onlyTprs }), [startDate, endDate])
    return result.rows
  },
}
