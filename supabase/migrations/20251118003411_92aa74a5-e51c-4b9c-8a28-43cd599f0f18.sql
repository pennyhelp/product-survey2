-- Update panchayaths table to include ward count
alter table public.panchayaths add column ward_count integer not null default 0;

-- Update RLS policies to allow anonymous users to insert surveys
drop policy if exists "Users can create surveys" on public.surveys;
drop policy if exists "Users can create survey items" on public.survey_items;

create policy "Anyone can create surveys"
on public.surveys
for insert
to anon, authenticated
with check (true);

create policy "Anyone can create survey items"
on public.survey_items
for insert
to anon, authenticated
with check (true);

-- Allow anonymous users to read panchayaths
drop policy if exists "Anyone can view panchayaths" on public.panchayaths;

create policy "Anyone can view panchayaths"
on public.panchayaths
for select
to anon, authenticated
using (true);