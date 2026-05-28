-- Grant explicit delete permissions to service_role for all resume/review tables
grant select, insert, update, delete on public.resumes to service_role;
grant select, insert, update, delete on public.reviews to service_role;
grant select, insert, update, delete on public.review_recommendations to service_role;
grant select, insert, delete on public.review_roadmap_actions to service_role;

-- Change reviews.resume_id FK to ON DELETE SET NULL so deleting a resume does
-- not cascade-delete saved reviews.
alter table public.reviews
  alter column resume_id drop not null;

alter table public.reviews
  drop constraint if exists reviews_resume_id_fkey;

alter table public.reviews
  add constraint reviews_resume_id_fkey
    foreign key (resume_id)
    references public.resumes(id)
    on delete set null;
