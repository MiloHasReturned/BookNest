create table if not exists public.booknest_profiles (
  email text primary key,
  google_sub text,
  username text not null,
  image_data text,
  theme jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booknest_calendars (
  id text primary key,
  name text not null,
  tint_index integer not null default 4,
  owner_email text not null references public.booknest_profiles(email) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booknest_memberships (
  calendar_id text not null references public.booknest_calendars(id) on delete cascade,
  user_email text not null references public.booknest_profiles(email) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (calendar_id, user_email)
);

create table if not exists public.booknest_calendar_state (
  calendar_id text primary key references public.booknest_calendars(id) on delete cascade,
  reservations jsonb not null default '[]'::jsonb,
  day_notes jsonb not null default '{}'::jsonb,
  chat jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.booknest_invites (
  id text primary key,
  calendar_id text not null references public.booknest_calendars(id) on delete cascade,
  recipient_email text not null,
  sender_email text not null references public.booknest_profiles(email) on delete cascade,
  sender_name text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists booknest_memberships_user_email_idx
  on public.booknest_memberships(user_email);

create index if not exists booknest_invites_recipient_status_idx
  on public.booknest_invites(recipient_email, status);

create or replace function public.booknest_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists booknest_profiles_touch_updated_at on public.booknest_profiles;
create trigger booknest_profiles_touch_updated_at
before update on public.booknest_profiles
for each row execute function public.booknest_touch_updated_at();

drop trigger if exists booknest_calendars_touch_updated_at on public.booknest_calendars;
create trigger booknest_calendars_touch_updated_at
before update on public.booknest_calendars
for each row execute function public.booknest_touch_updated_at();

drop trigger if exists booknest_calendar_state_touch_updated_at on public.booknest_calendar_state;
create trigger booknest_calendar_state_touch_updated_at
before update on public.booknest_calendar_state
for each row execute function public.booknest_touch_updated_at();
