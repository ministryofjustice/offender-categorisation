const whereClause = `status = 'APPROVED' and
  cat_type = $1::cat_type_enum and
  ($2::date is null or $2::date <= approval_date) and
  ($3::date is null or approval_date <= $3::date) and
  ($4::varchar is null or $4::varchar = prison_id)`

module.exports = {
  getInitialCategoryOutcomes(startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select count(*),
               form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory' as "initialCat",
               form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory' as "initialOverride",
               form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory' as "superOverride"
             from form
             where ${whereClause}
             group by "initialCat", "initialOverride",  "superOverride"
             order by "initialCat",  "initialOverride" NULLS FIRST, "superOverride" NULLS FIRST`,
      values: ['INITIAL', startDate, endDate, prisonId],
    }
    return transactionalClient.query(query)
  },

  getRecatCategoryOutcomes(startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select count(*),
                    form_response -> 'recat' -> 'decision' ->>'category' as recat,
                    form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory' as "superOverride"
             from form
             where ${whereClause}
             group by recat, "superOverride"
             order by recat, "superOverride" NULLS FIRST`,
      values: ['RECAT', startDate, endDate, prisonId],
    }
    return transactionalClient.query(query)
  },

  /** The latest category before the end date is considered along with its predecessor */
  getRecatFromTo(startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `
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
                    and ($3::date is null or f1.approval_date <= $3::date)
                  order by sequence_no desc
                   LIMIT 1) as previous_cat,
                 coalesce(f.form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory',
                          f.form_response -> 'recat' -> 'decision' ->> 'category') as cat
          from form as f
          where ${whereClause}
        ),
             arrays_table as (
               select array_agg(array [prison_id,previous_cat,cat] order by sequence_no desc) as data
               from cat_table
               group by booking_id,sequence_no
             )
        select count(*), data[1][2] as previous, data[1][3] as current
        from arrays_table
        group by previous, current`,
      values: ['RECAT', startDate, endDate, prisonId],
    }
    return transactionalClient.query(query)
  },

  getSecurityReferrals(catType, startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select count(*),
               CASE WHEN
                 risk_profile -> 'socProfile' ->> 'transferToSecurity' is not null and
                 risk_profile -> 'socProfile' ->> 'transferToSecurity' = 'true' THEN 'auto'
               WHEN
                 form_response -> 'ratings' -> 'securityInput' ->> 'securityInputNeeded' is not null or
                 form_response -> 'recat' -> 'securityInput' ->> 'securityInputNeeded' is not null THEN 'manual'
               ELSE 'flagged'
               END as "security"
             from form
             where referred_date is not null and ${whereClause}
             group by "security"`,
      values: [catType, startDate, endDate, prisonId],
    }
    return transactionalClient.query(query)
  },

  getTimeliness(catType, startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select avg(extract(day from (due_by_date - date_trunc('day', approval_date))))  as "approvalTimelinessDays",
                    avg(extract(epoch from (referred_date - start_date))/86400)               as "securityReferralTimelinessDays",
                    avg(extract(epoch from (security_reviewed_date - referred_date))/86400)   as "inSecurityDays",
                    avg(extract(day from (assessment_date - date_trunc('day', start_date)))) as "startToAssessmentDays",
                    avg(approval_date - assessment_date)                                     as "assessmentToApprovalDays"
             from form
             where ${whereClause}`,
      values: [catType, startDate, endDate, prisonId],
    }
    return transactionalClient.query(query)
  },

  getOnTime(catType, startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select count(*),
                    extract(day from (coalesce(due_by_date, approval_date) - date_trunc('day', approval_date))) >= 0 as "onTime"
             from form
             where ${whereClause}
             group by "onTime"`,
      values: [catType, startDate, endDate, prisonId],
    }
    return transactionalClient.query(query)
  },
}
