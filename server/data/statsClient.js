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

  getSecurityReferrals(catType, startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select count(*),
                    risk_profile -> 'socProfile' ->> 'transferToSecurity' is not null and risk_profile -> 'socProfile' ->> 'transferToSecurity' = 'true' as "securityAuto"
             from form
             where referred_date is not null and ${whereClause}
             group by "securityAuto"`,
      values: [catType, startDate, endDate, prisonId],
    }
    return transactionalClient.query(query)
  },

  getTimeliness(catType, startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select avg(extract(day from (due_by_date - date_trunc('day', approval_date))))  as "approvalTimelinessDays",
                    avg(extract(epoch from (referred_date - start_date))/3600)               as "securityReferralTimelinessHours",
                    avg(extract(epoch from (security_reviewed_date - referred_date))/3600)   as "inSecurityHours",
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
