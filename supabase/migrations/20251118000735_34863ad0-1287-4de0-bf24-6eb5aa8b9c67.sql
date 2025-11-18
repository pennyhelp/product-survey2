-- Create app_role enum for user roles
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    created_at timestamp with time zone default now(),
    unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create panchayaths table
create table public.panchayaths (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    created_at timestamp with time zone default now()
);

alter table public.panchayaths enable row level security;

create policy "Admins can manage panchayaths"
on public.panchayaths
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Anyone can view panchayaths"
on public.panchayaths
for select
to authenticated
using (true);

-- Create surveys table
create table public.surveys (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    mobile text not null,
    panchayath text not null,
    ward text not null,
    user_type text not null,
    created_at timestamp with time zone default now()
);

alter table public.surveys enable row level security;

create policy "Admins can view all surveys"
on public.surveys
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Users can create surveys"
on public.surveys
for insert
to authenticated
with check (true);

-- Create survey_items table for products/services
create table public.survey_items (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid references public.surveys(id) on delete cascade not null,
    item_name text not null,
    item_type text not null check (item_type in ('product', 'service')),
    created_at timestamp with time zone default now()
);

alter table public.survey_items enable row level security;

create policy "Admins can view all survey items"
on public.survey_items
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Users can create survey items"
on public.survey_items
for insert
to authenticated
with check (true);