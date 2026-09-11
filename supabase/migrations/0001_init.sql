-- LUCKMI v7 M3 账号/权限/订单 初始化迁移
-- 角色：guest / registered / single_paid / bazi_report / pro_monthly / pro_yearly / consult_owner

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  locale text not null default 'en' check (locale in ('en','zh')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email) values (new.id, new.email) on conflict (user_id) do nothing;
  -- 新用户默认 registered 角色（v7 §5.2）
  insert into public.entitlements (user_id, role) values (new.id, 'registered') on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  sku text not null check (sku in ('quick','bazi_report','annual_report','consult_wa','pro_monthly','pro_yearly')),
  amount_usd numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  payment_provider text not null check (payment_provider in ('creem','paypal','stripe','apple_iap')),
  provider_ref text,
  first_purchase_done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders(user_id);
create unique index if not exists orders_first_quick_unique
  on public.orders (user_id) where sku = 'quick' and first_purchase_done = true;

create table if not exists public.entitlements (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  role text not null default 'registered'
    check (role in ('guest','registered','single_paid','bazi_report','pro_monthly','pro_yearly','consult_owner')),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;

create policy "profiles self read" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = user_id);
create policy "orders self read" on public.orders for select using (auth.uid() = user_id);
create policy "entitlements self read" on public.entitlements for select using (auth.uid() = user_id);

comment on table public.profiles is '用户档案，auth.users 1:1，handle_new_user 触发器自动创建';
comment on table public.orders is '订单表；first_purchase_done 部分唯一索引实现首单判定';
comment on table public.entitlements is '角色与有效期；webhook 由 service_role 写入，RLS 禁止用户自写';
