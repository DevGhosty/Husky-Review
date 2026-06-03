-- Verify service_role DELETE grants required for resume/review API deletes.
-- Run in Supabase SQL Editor when DELETE /api/resumes/:id or DELETE /api/reviews/:id returns 500.

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'service_role'
  and table_schema = 'public'
  and table_name in ('resumes', 'reviews', 'review_recommendations', 'review_roadmap_actions')
  and privilege_type = 'DELETE'
order by table_name;

-- confdeltype = 'n' means ON DELETE SET NULL (correct after fix_reviews_delete migration).
-- confdeltype = 'c' means ON DELETE CASCADE (old behavior — deleting a resume deletes saved reviews).
select conname, confdeltype
from pg_constraint
where conname = 'reviews_resume_id_fkey';
