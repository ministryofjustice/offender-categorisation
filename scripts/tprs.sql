with cat_data as (select
                    prison_id,
                    offender_no,
                    booking_id,
                    status,
                    start_date,
                    approval_date,
                    form_response -> 'openConditions' -> 'tprs' ->> 'tprsSelected' as tprsSelected
                  from form
                  where
                    status = 'APPROVED' and
                    '2023-03-01' <= approval_date and approval_date < '2023-04-01'

)
-- to show details:
--select * from cat_data where tprsSelected = 'Yes'
-- to show grouped:
select prison_id, count(*)
from cat_data
where tprsSelected = 'Yes'
group by prison_id
