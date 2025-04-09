const { config } = require('../config')
const StatsType = require('../utils/statsTypeEnum')
const { isFemalePrisonId } = require('../utils/utils')

const whereClauseStart = `status = 'APPROVED' and
  cat_type = $1::cat_type_enum and
  ($2::date is null or $2::date <= approval_date) and
  ($3::date is null or approval_date <= $3::date)`

const femalePrisonIdCsv = config.femalePrisonIds.split(',').join(`','`)
const femaleInClause = ` and prison_id in ('${femalePrisonIdCsv}')`
const femaleNotInClause = ` and prison_id not in ('${femalePrisonIdCsv}')`

function createWhereClause(prisonId) {
  let endPart
  if (prisonId === StatsType.MALE) {
    endPart = femaleNotInClause
  } else if (prisonId === StatsType.FEMALE) {
    endPart = femaleInClause
  } else if (prisonId === null || prisonId === undefined) {
    endPart = femaleNotInClause // fallback
  } else {
    endPart = ` and prison_id = '${prisonId}'`
  }
  return whereClauseStart + endPart
}

function createInitialCategoryOutcomesQuery(startDate, endDate, prisonId) {
  const isFemale = prisonId === StatsType.FEMALE || isFemalePrisonId(prisonId)
  if (isFemale) {
    return {
      text: `select count(*),
               coalesce(form_response -> 'ratings' ->'decision' ->>'category',
                        form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory') as "initialCat",
               form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory' as "superOverride"
             from form
             where ${createWhereClause(prisonId)}
             group by "initialCat", "superOverride"
             order by "initialCat", "superOverride" NULLS FIRST`,
      values: ['INITIAL', startDate, endDate],
    }
  }
  return {
    text: `select count(*),
             form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory' as "initialCat",
             form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory' as "initialOverride",
             form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory' as "superOverride"
           from form
           where ${createWhereClause(prisonId)}
           group by "initialCat", "initialOverride",  "superOverride"
           order by "initialCat",  "initialOverride" NULLS FIRST, "superOverride" NULLS FIRST`,
    values: ['INITIAL', startDate, endDate],
  }
}

function createTprsTotalsQuery(catType, startDate, endDate, prisonId) {
  return {
    text: `with cat_data as (select
                          form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' as tprsSelected,
                          coalesce(
                                  form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory',
                                  form_response -> 'recat' -> 'decision' ->> 'category',
                                  form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory',
                                  form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory',
                                  form_response -> 'ratings' ->'decision' ->>'category'
                            ) as finalCat
           from form
           where ${createWhereClause(prisonId)})
           select count(*) as tprs_selected from cat_data where tprsSelected = 'Yes' and finalCat in ('D', 'J', 'T')`,
    values: [catType, startDate, endDate],
  }
}

module.exports = {
  getWhereClause(prisonId) {
    return createWhereClause(prisonId)
  },
  getInitialCategoryOutcomesQuery(startDate, endDate, prisonId) {
    return createInitialCategoryOutcomesQuery(startDate, endDate, prisonId)
  },

  getInitialCategoryOutcomes(startDate, endDate, prisonId, transactionalClient) {
    return transactionalClient.query(createInitialCategoryOutcomesQuery(startDate, endDate, prisonId))
  },

  getRecatCategoryOutcomes(startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select count(*),
                    form_response -> 'recat' -> 'decision' ->>'category' as recat,
                    form_response -> 'supervisor' ->'review' ->>'supervisorOverriddenCategory' as "superOverride"
             from form
             where ${createWhereClause(prisonId)}
             group by recat, "superOverride"
             order by recat, "superOverride" NULLS FIRST`,
      values: ['RECAT', startDate, endDate],
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
          where ${createWhereClause(prisonId)}
        ),
             arrays_table as (
               select array_agg(array [prison_id,previous_cat,cat] order by sequence_no desc) as data
               from cat_table
               group by booking_id,sequence_no
             )
        select count(*), data[1][2] as previous, data[1][3] as current
        from arrays_table
        group by previous, current`,
      values: ['RECAT', startDate, endDate],
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
             where referred_date is not null and ${createWhereClause(prisonId)}
             group by "security"`,
      values: [catType, startDate, endDate],
    }
    return transactionalClient.query(query)
  },

  getTimeline(catType, startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select avg(extract(day from (date_trunc('day', referred_date) - date_trunc('day', start_date))))              as "fromStartToReferred",
                    avg(extract(day from (date_trunc('day', security_reviewed_date) - date_trunc('day', referred_date))))  as "fromReferredToSecurityReviewed",
                    avg(extract(day from (approval_date - date_trunc('day', security_reviewed_date))))  as "fromSecurityReviewedToApproval",
                    avg(extract(day from (approval_date - date_trunc('day', start_date))))  as "fromStartToApproval"
             from form
             where ${createWhereClause(prisonId)}`,
      values: [catType, startDate, endDate],
    }
    return transactionalClient.query(query)
  },

  getOnTime(catType, startDate, endDate, prisonId, transactionalClient) {
    const query = {
      text: `select count(*),
                    extract(day from (coalesce(due_by_date, approval_date) - date_trunc('day', approval_date))) >= 0 as "onTime"
             from form
             where ${createWhereClause(prisonId)}
             group by "onTime"`,
      values: [catType, startDate, endDate],
    }
    return transactionalClient.query(query)
  },

  getTprsTotalsQuery(catType, startDate, endDate, prisonId) {
    return createTprsTotalsQuery(catType, startDate, endDate, prisonId)
  },

  getTprsTotals(catType, startDate, endDate, prisonId, transactionalClient) {
    return transactionalClient.query(createTprsTotalsQuery(catType, startDate, endDate, prisonId))
  },
}
