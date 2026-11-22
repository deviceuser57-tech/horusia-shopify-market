-- Seed OWNER role for the two store owner accounts

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
join public.roles r on r.name = 'OWNER'
where lower(u.email) in (
  'tumaninahveritasstore@gmail.com',
  'deviceuser57@gmail.com'
)
on conflict (user_id, role_id) do nothing;

-- Extend profile-creation trigger to also grant OWNER to owner emails on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  if lower(NEW.email) in (
    'tumaninahveritasstore@gmail.com',
    'deviceuser57@gmail.com'
  ) then
    insert into public.user_roles (user_id, role_id)
    select NEW.id, r.id
    from public.roles r
    where r.name = 'OWNER'
    on conflict (user_id, role_id) do nothing;
  end if;

  return NEW;
end;
$$;

-- Allow users to read their own role memberships (used by AdminGuard)
create policy "Users can read own roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());
