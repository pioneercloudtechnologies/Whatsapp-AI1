-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.

-- 1. Durable webhook dedupe (replaces the old in-memory Set, which leaked
--    memory and reset on every restart/deploy).
create table if not exists processed_messages (
  message_id text primary key,
  created_at timestamptz not null default now()
);

-- Optional: keep this table small by periodically deleting old rows,
-- e.g. via a scheduled SQL snippet or pg_cron:
-- delete from processed_messages where created_at < now() - interval '30 days';

-- 2. Unique constraints so getOrCreateConversation / getUserSettings /
--    saveMemory can safely recover from a race between two near-simultaneous
--    messages instead of creating duplicate rows.
--
-- IMPORTANT: if duplicate rows already exist (e.g. from the race condition
-- this migration fixes), the ADD CONSTRAINT below will fail. Run this first
-- to check, and manually delete/merge any duplicates it finds before
-- proceeding:
--
--   select user_phone, count(*) from conversations group by user_phone having count(*) > 1;
--   select user_phone, count(*) from ai_settings group by user_phone having count(*) > 1;
--   select user_phone, memory_key, count(*) from memories group by user_phone, memory_key having count(*) > 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'conversations_user_phone_key'
  ) then
    alter table conversations
      add constraint conversations_user_phone_key unique (user_phone);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ai_settings_user_phone_key'
  ) then
    alter table ai_settings
      add constraint ai_settings_user_phone_key unique (user_phone);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'memories_user_phone_key_key'
  ) then
    alter table memories
      add constraint memories_user_phone_key_key unique (user_phone, memory_key);
  end if;
end $$;
