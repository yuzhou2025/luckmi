-- 0002_add_creem_provider.sql
-- M3 步骤3：orders 表 payment_provider 加 'creem'
-- Creem (Merchant of Record) 替代 PayPal 作为首选支付渠道

-- 先删旧约束再加新约束（PostgreSQL check 约束无法直接修改）
alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders add constraint orders_payment_provider_check
  check (payment_provider in ('creem','paypal','stripe','apple_iap'));
