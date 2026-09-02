-- Skrip wawancara per lowongan, dirancang oleh Hermes AI Assessment Designer.
-- Disimpan di level jobs agar semua pelamar posisi yang sama diuji
-- dengan kerangka kompetensi yang identik.
alter table public.jobs
  add column if not exists interview_blueprints_json jsonb;

comment on column public.jobs.interview_blueprints_json is
  'Skrip wawancara hasil generate Hermes: array kompetensi berisi question_text, required_topics, prepared_probe. Null berarti belum pernah digenerate.';
