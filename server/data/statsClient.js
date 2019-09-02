module.exports = {
  getInitialCategoryOutcomes(transactionalClient) {
    const query = {
      text: `select count(*),
               form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory' as "initialCat",
               form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory' as "initialOverride",
               form_response -> 'supervisor' ->'review' ->>'proposedCategory' as super,
               form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory' as "superOverride"
             from form
             where status = 'APPROVED' and cat_type = 'INITIAL'
             group by    
               form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory',
               form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory',
               form_response -> 'supervisor' ->'review' ->>'proposedCategory',
               form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory'`,
    }
    return transactionalClient.query(query)
  },

  getRecatCategoryOutcomes(transactionalClient) {
    const query = {
      text: `select count(*),
               form_response -> 'recat'->'decision' ->>'category' as recat,
               form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory' as "superOverride"
             from form
             where status = 'APPROVED' and cat_type = 'RECAT'
             group by
               form_response -> 'recat'->'decision' ->>'category',
               form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory'`,
    }
    return transactionalClient.query(query)
  },

  getSecurityReferrals(transactionalClient) {
    const query = {
      text: `select count(*),
        cat_type as "catType",
        risk_profile -> 'socProfile' ->> 'transferToSecurity' is not null and risk_profile -> 'socProfile' ->> 'transferToSecurity' = 'true' as "securityAuto"
    from form
    where status = 'APPROVED' and referred_date is not null
    group by cat_type,
        risk_profile -> 'socProfile' ->> 'transferToSecurity' is not null and risk_profile -> 'socProfile' ->> 'transferToSecurity' = 'true'`,
    }
    return transactionalClient.query(query)
  },

  getTimeliness(transactionalClient) {
    const query = {
      // TODO also need %age 'on time'
      text: `select
        cat_type                                                                 as "catType",
        avg(extract(day from (due_by_date  - date_trunc ('day',approval_date)))) as "approvalTimelinessDays",
        avg(extract(hour from (referred_date - start_date)))                     as "securityReferralTimelinessHours",
        avg(extract(hour from (security_reviewed_date - referred_date)))         as "inSecurityHours",
        avg(extract(day from (assessment_date - date_trunc('day', start_date)))) as "startToAssessmentDays",
        avg(approval_date - assessment_date)                                     as "assessmentToApprovalDays" -- days
      from form
      where status = 'APPROVED'
      group by cat_type`,
    }
    return transactionalClient.query(query)
  },
}
