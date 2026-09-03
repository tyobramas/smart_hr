-- Communication logs table for SmartHR Communication Engine
-- Tracks all outbound candidate emails

CREATE TABLE IF NOT EXISTS public.communication_logs (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id        uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  candidate_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id                uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type            text NOT NULL,
  email_to              text NOT NULL,
  email_subject         text NOT NULL,
  email_body_html       text NOT NULL,
  email_body_text       text,
  status                text NOT NULL DEFAULT 'queued',
  hermes_model          text,
  hermes_duration_ms    integer,
  provider_message_id   text,
  error_message         text,
  sent_at               timestamptz,
  created_at            timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT communication_logs_event_type_check CHECK (event_type IN (
    'application_received', 'screening_passed', 'screening_rejected',
    'screening_review', 'personality_reminder', 'personality_completed',
    'interview_invitation', 'interview_reminder_48h', 'interview_reminder_24h',
    'interview_completed', 'interview_expired', 'final_rejection'
  )),
  CONSTRAINT communication_logs_status_check CHECK (
    status IN ('queued', 'sent', 'failed', 'bounced', 'opened')
  )
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_app_event   ON public.communication_logs(application_id, event_type);
CREATE INDEX IF NOT EXISTS idx_comm_logs_candidate   ON public.communication_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_status      ON public.communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_comm_logs_created     ON public.communication_logs(created_at DESC);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all communication logs" ON public.communication_logs;
CREATE POLICY "Admin can view all communication logs"
  ON public.communication_logs FOR SELECT TO authenticated
  USING (public.is_admin());

