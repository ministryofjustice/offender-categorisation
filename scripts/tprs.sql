with cat_data as (select
                    prison_id,
                    offender_no,
                    booking_id,
                    form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' as tprsSelected,
                    form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory' as supervisorOverriddenCategory,
                    form_response -> 'recat' -> 'decision' ->> 'category' as category,
                    form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory' as overriddenCategory,
                    form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory' as suggestedCategory,
                    form_response -> 'ratings' ->'decision' ->>'category' as ratingsDecision,
                    coalesce(
                            form_response -> 'supervisor' -> 'review' ->> 'supervisorOverriddenCategory',
                            form_response -> 'recat' -> 'decision' ->> 'category',
                            form_response -> 'categoriser'->'provisionalCategory' ->>'overriddenCategory',
                            form_response -> 'categoriser'->'provisionalCategory' ->>'suggestedCategory',
                            form_response -> 'ratings' ->'decision' ->>'category'
                      ) as finalCat,
                    status,
                    start_date,
                    approval_date
                  from form
                  where
                      status = 'APPROVED' and
                      '2023-03-01' <= approval_date and approval_date < '2023-04-01'
                    and cat_type = 'RECAT'

)
-- to show details:
select * from cat_data where tprsSelected = 'Yes' --and finalCat in ('D', 'J', 'T')
-- to show grouped:
-- select prison_id, count(*)
-- from cat_data
-- where tprsSelected = 'Yes'
-- group by prison_id
