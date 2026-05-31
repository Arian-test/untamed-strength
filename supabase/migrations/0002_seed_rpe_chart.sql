-- Seed the RPE chart: percentage = 100 - 4*(10 - rpe) - f(reps)
-- f(reps): 1->0, 2->3, 3->6, 4->8.5, 5->11, 6->13.5, 7->16, 8->18,
--          9->20, 10->22, 11->24, 12->26
-- Reproduces 1@10=100, 1@9=96, 1@8=92, 5@8=81, 5@7=77.

insert into rpe_chart (reps, rpe, percentage)
select r.reps,
       p.rpe,
       round((100 - 4 * (10 - p.rpe) - f.drop)::numeric, 1) as percentage
from (values (1,0.0),(2,3.0),(3,6.0),(4,8.5),(5,11.0),(6,13.5),
             (7,16.0),(8,18.0),(9,20.0),(10,22.0),(11,24.0),(12,26.0)) as f(reps, drop)
join (select generate_series(1,12) as reps) r on r.reps = f.reps
cross join (values (6.0),(6.5),(7.0),(7.5),(8.0),(8.5),(9.0),(9.5),(10.0)) as p(rpe)
on conflict (reps, rpe) do update set percentage = excluded.percentage;
