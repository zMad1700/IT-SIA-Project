-- Migration: 20260912_enable_realtime_publication.sql
-- Enables Supabase Realtime replication on ScholarHub tables so clients receive live updates.

do $$
begin
  -- Ensure supabase_realtime publication exists
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Enable replication for live update channels
alter publication supabase_realtime add table public.renewal_documents;
alter publication supabase_realtime add table public.help_requests;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.renewal_schedules;
