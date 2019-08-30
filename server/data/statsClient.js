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
}
