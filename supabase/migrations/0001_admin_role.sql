-- 0001_admin_role.sql
-- Writes the authoritative `role` to auth.users.raw_app_meta_data at signup.
-- Users can't self-promote: any requested role outside the whitelist
-- defaults to 'buyer'. 'admin' is never signup-selectable.

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  allowed   text;
begin
  allowed := case
    when requested in ('buyer', 'seller', 'broker') then requested
    else 'buyer'
  end;

  new.raw_app_meta_data :=
    coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', allowed);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_set_role on auth.users;

create trigger on_auth_user_created_set_role
before insert on auth.users
for each row
execute function public.handle_new_user_role();

-- Backfill existing users that are missing app_metadata.role.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                        || jsonb_build_object(
                             'role',
                             coalesce(raw_user_meta_data ->> 'role', 'buyer')
                           )
where raw_app_meta_data ->> 'role' is null;

-- is_admin() — readable in RLS policies via auth.jwt().
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

comment on function public.is_admin() is
  'Returns true when the caller''s JWT carries app_metadata.role = admin.';
