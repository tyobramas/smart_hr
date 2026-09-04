-- Migration: Add multi-channel support (WhatsApp & Email) to communication_logs

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'communication_logs' 
      AND column_name = 'channel'
  ) THEN
    ALTER TABLE public.communication_logs
    ADD COLUMN channel text NOT NULL DEFAULT 'email' 
    CHECK (channel IN ('email', 'whatsapp'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'communication_logs' 
      AND column_name = 'phone_to'
  ) THEN
    ALTER TABLE public.communication_logs
    ADD COLUMN phone_to text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comm_logs_channel 
ON public.communication_logs(channel);

CREATE INDEX IF NOT EXISTS idx_comm_logs_app_channel 
ON public.communication_logs(application_id, channel);

