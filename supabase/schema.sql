-- Run this once in Supabase: SQL Editor > New query.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  first_name text,
  middle_name text,
  last_name text,
  phone text,
  sex text,
  birth_date date,
  purok text,
  barangay text,
  municipality text,
  school text,
  year_level text,
  course text,
  scholar_type text,
  role text not null default 'user' check (role in ('user', 'admin')),
  photo text,
  bio text,
  requirements_status text default 'Complete',
  scholar_status text default 'Active',
  added_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, name, first_name, middle_name, last_name, phone, sex, birth_date,
    purok, barangay, municipality, school, year_level, course, scholar_type
  ) values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'middle_name',
    new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'sex', nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    new.raw_user_meta_data ->> 'purok', new.raw_user_meta_data ->> 'barangay',
    new.raw_user_meta_data ->> 'municipality', new.raw_user_meta_data ->> 'school',
    new.raw_user_meta_data ->> 'year_level', new.raw_user_meta_data ->> 'course',
    new.raw_user_meta_data ->> 'scholar_type'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());
drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id and role = 'user');
drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- After registering admin@gmail.com through the app, run this once to grant admin access:
-- update public.profiles set role = 'admin' where email = 'admin@gmail.com';
