create table if not exists public.app_settings (
  id text primary key,
  free_mode_enabled boolean not null default false,
  free_mode_banner text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;

create policy "Anyone can read app settings"
on public.app_settings
for select
using (true);

create policy "Super admins can update app settings"
on public.app_settings
for update
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'super_admin'
  )
);

insert into public.app_settings (id, free_mode_enabled, free_mode_banner)
values ('global', false, 'Company anniversary: unlimited free CV revamps today 🎉')
on conflict (id) do nothing;
