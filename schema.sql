-- Run once in Supabase SQL Editor. Never put the service_role key in website files.
create extension if not exists pgcrypto;
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.inquiries (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 name text not null check (char_length(name) between 2 and 150),
 email text not null check (char_length(email) between 3 and 254), phone text,
 trip text, adults integer not null default 2 check (adults between 1 and 30),
 kids integer not null default 0 check (kids between 0 and 30),
 travel_month text, notes text, status text not null default 'new' check (status in ('new','contacted','quoted','booked','closed')),
 owner_id uuid references auth.users(id) on delete set null
);
create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 title text not null check (char_length(title) between 1 and 180), body text not null,
 image_url text, published boolean not null default false
);
create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 client_id uuid references auth.users(id) on delete set null,
 client_name text not null, destination text not null, departure_date date,
 status text not null default 'planning' check (status in ('planning','deposit_due','confirmed','traveling','completed','cancelled')),
 amount numeric(12,2) check (amount >= 0), notes text
);
create table if not exists public.commission_records (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 booking_id uuid references public.bookings(id) on delete set null,
 gross_amount numeric(12,2) not null check (gross_amount >= 0),
 commission_rate numeric(5,2) not null check (commission_rate between 0 and 100),
 agent_split numeric(5,2) not null check (agent_split between 0 and 100)
);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
alter table public.admins enable row level security;
alter table public.inquiries enable row level security;
alter table public.posts enable row level security;
alter table public.bookings enable row level security;
alter table public.commission_records enable row level security;
create policy "Admins can view own admin record" on public.admins for select to authenticated using (user_id = (select auth.uid()));
create policy "Visitors can submit inquiries" on public.inquiries for insert to anon, authenticated with check (status = 'new' and owner_id is null);
create policy "Admins manage inquiries" on public.inquiries for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Published posts are public" on public.posts for select to anon, authenticated using (published = true);
create policy "Admins manage posts" on public.posts for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage bookings" on public.bookings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Clients view own bookings" on public.bookings for select to authenticated using (client_id = (select auth.uid()));
create policy "Admins manage commissions" on public.commission_records for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- After creating your account in Supabase Auth, replace the email and run this separately:
-- insert into public.admins(user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com' on conflict do nothing;
