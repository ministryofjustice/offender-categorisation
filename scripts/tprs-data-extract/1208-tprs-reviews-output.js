const { db } = require('./tprs-stats-helpers')

const query = `
WITH filtered_forms AS (
    SELECT
                offender_no AS offender_number,
                prison_id AS establishment,
                assessment_date AS review_date,
                cat_type,
                coalesce(
                  form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory',
                  form_response -> 'recat' -> 'decision' ->> 'category',
                  form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory',
                  form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory',
                  form_response -> 'ratings' ->'decision' ->>'category'
                ) as approved_as_category
    FROM
        public.form
    WHERE
      form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' = 'Yes'
      AND status = 'APPROVED'
      AND (approval_date >= COALESCE($1::date, (SELECT MIN(approval_date) FROM public.form)))
      AND (approval_date <= COALESCE($2::date, CURRENT_DATE))
)
SELECT
    offender_number,
    establishment,
    cat_type,
    review_date,
    approved_as_category
FROM
    filtered_forms
ORDER BY
    establishment,
    cat_type,
    review_date DESC;
`

module.exports = {
  getTprsReviewsOutput: async ({ startDate, endDate }) => {
    const result = await db.query(query, [startDate, endDate])
    return result.rows
  },
}
