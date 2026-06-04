-- Align activities.campus with authoritative source hosts (HuskyLink = Seattle, Gather = Bothell).

update public.activities
set campus = 'seattle'
where lower(coalesce(campus, '')) = 'bothell'
  and lower(coalesce(source_url, '')) like '%huskylink.washington.edu%';

update public.activities
set campus = 'tacoma'
where lower(coalesce(campus, '')) != 'tacoma'
  and (
    lower(coalesce(source_url, '')) like '%dubnet.tacoma%'
    or lower(coalesce(source_url, '')) like '%tacoma.uw.edu%'
  );

update public.activities
set campus = 'bothell'
where lower(coalesce(campus, '')) != 'bothell'
  and lower(coalesce(source_url, '')) like '%gather.uwb.edu%';
