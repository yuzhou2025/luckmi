-- 0003_fix_first_purchase_pending.sql
-- 修复缺陷：原部分唯一索引不区分订单状态，pending 订单在创建时即写入
-- first_purchase_done=true，一旦上游支付失败/用户放弃，该 pending 永久占位，
-- 导致用户再次下单时撞 orders_first_quick_unique（500 duplicate key）。
--
-- 修复：
--  1) 存量 pending/failed 订单的 first_purchase_done 重置为 false（释放占位）
--  2) 唯一索引仅约束「已支付的首单」
-- 应用层（orderService.ts）配合：pending 不写首单标记；markPaid 时按 paid 事实置位。

-- 1) 释放未完成订单的首单占位
update public.orders
set first_purchase_done = false
where status in ('pending', 'failed')
  and first_purchase_done = true;

-- 2) 重建索引：仅 paid 首单参与唯一性
drop index if exists orders_first_quick_unique;
create unique index orders_first_quick_unique
  on public.orders (user_id)
  where sku = 'quick' and first_purchase_done = true and status = 'paid';
