-- Migration: Add 'skipped' status to communication_logs check constraint

DO $$
BEGIN
  ALTER TABLE public.communication_logs
  DROP CONSTRAINT IF EXISTS communication_logs_status_check;

  ALTER TABLE public.communication_logs
  ADD CONSTRAINT communication_logs_status_check CHECK (
    status IN ('queued', 'sent', 'failed', 'bounced', 'opened', 'skipped')
  );
END $$;
