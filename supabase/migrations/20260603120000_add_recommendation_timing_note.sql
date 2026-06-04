alter table public.review_recommendations
  add column if not exists timing_note text;
